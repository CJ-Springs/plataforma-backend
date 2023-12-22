import { ProductPosition, ProductType } from '@prisma/client'
import { BadRequestException, Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import * as Papa from 'papaparse'

import { LoggerService } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Types } from '@/.shared/types'
import { ProductAddedEvent } from './events/impl/product-added.event'

@Injectable()
export class ProductsService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  parseProductsFromCSVFile(file: Buffer, fathers: boolean): ParsedProduct[] {
    this.logger.log('products', 'Parsing CSV file', {
      logType: 'service',
    })

    const { data } = Papa.parse(file.toString())
    const [keys, ...products] = data as Array<string[]>

    const productFields = fathers ? fathersFields : associatedFields

    const allKeysMustBeIncluded = productFields
      .map((field) => field.key)
      .every((key) => keys.includes(key))

    if (!allKeysMustBeIncluded || productFields.length < keys.length) {
      throw new BadRequestException(
        'Faltan o sobran campos en el archivo enviado',
      )
    }

    const parseProducts = products.reduce<ParsedProduct[]>((acc, csvValues) => {
      const product = csvValues.reduce<any>((acc, value, i) => {
        let actualValue: any = value
        const field = productFields.find((field) => field.key === keys[i])

        if (value === '' && field.type !== 'boolean') actualValue = null
        else if (field.type === 'number') actualValue = Number(value)
        else if (field.type === 'boolean') actualValue = Boolean(value)

        return { ...acc, [field.key]: actualValue }
      }, {})

      acc.push(product)

      return acc
    }, [])

    return parseProducts
  }

  async registerBulkProducts(products: ParsedProduct[], fathers: boolean) {
    this.logger.log('products', 'Bulk Inserting Products', {
      logType: 'service',
    })

    const failedProducts = []
    const successfulProducts = []

    for await (const prod of products) {
      const {
        price,
        canAssociate,
        minQuantity,
        quantityOnHand,
        springCode,
        ...product
      } = prod

      await this.prisma.$transaction(async (tx) => {
        try {
          let connectToSpring = springCode

          if (fathers) {
            const createdSpring = await tx.spring.create({
              data: {
                code: product.code,
                canAssociate,
                stock: {
                  create: {
                    minQuantity,
                    quantityOnHand,
                  },
                },
              },
            })

            connectToSpring = createdSpring.code
          }

          const createdProduct = await tx.product.create({
            data: {
              ...product,
              amountOfSales: 0,
              price: { create: { price } },
              spring: { connect: { code: connectToSpring } },
            },
            include: {
              price: true,
              spring: {
                include: { stock: true },
              },
            },
          })

          this.eventBus.publish(new ProductAddedEvent(createdProduct))

          successfulProducts.push({ code: product.code })
        } catch (err) {
          this.logger.error(
            `Error creando el producto ${product.code}`,
            'Products',
          )
          console.log({ ...err })

          failedProducts.push({ code: product.code, error: { ...err } })
        }
      })
    }

    return {
      success: !failedProducts.length,
      message: `Se crearon ${successfulProducts.length} productos ${
        fathers ? 'padres' : 'asociados'
      }`,
      successful: successfulProducts,
      failed: failedProducts,
    }
  }
}

type ParsedProduct = {
  code: string
  brand: string
  model: string
  description?: string
  position: ProductPosition
  type: ProductType
  isGnc: boolean
  price: number
  springCode?: string
  canAssociate?: boolean
  minQuantity?: number
  quantityOnHand?: number
}

const productFields: { key: keyof ParsedProduct; type: Types }[] = [
  {
    key: 'code',
    type: 'string',
  },
  {
    key: 'brand',
    type: 'string',
  },
  {
    key: 'model',
    type: 'string',
  },
  {
    key: 'description',
    type: 'string',
  },
  {
    key: 'position',
    type: 'string',
  },
  {
    key: 'type',
    type: 'string',
  },
  {
    key: 'isGnc',
    type: 'boolean',
  },
  {
    key: 'price',
    type: 'number',
  },
]

const fathersFields: typeof productFields = [
  ...productFields,
  {
    key: 'canAssociate',
    type: 'boolean',
  },
  {
    key: 'minQuantity',
    type: 'number',
  },
  {
    key: 'quantityOnHand',
    type: 'number',
  },
]

const associatedFields: typeof productFields = [
  ...productFields,
  {
    key: 'springCode',
    type: 'string',
  },
]
