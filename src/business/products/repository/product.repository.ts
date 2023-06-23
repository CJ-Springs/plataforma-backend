import { Injectable } from '@nestjs/common'

import { Product } from '../aggregate/product.aggregate'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { ProductAddedEvent } from '../events/impl/product-added.event'

@Injectable()
export class ProductRepository implements IRepository<Product> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Product>> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          spring: {
            include: {
              stock: true,
            },
          },
        },
      })

      if (!product) {
        return null
      }

      return Product.create(product)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el producto ${id} en la db`,
      )
      return null
    }
  }

  async save(product: Product): Promise<void> {
    const events = product.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof ProductAddedEvent) {
          return this.addProduct(event.data)
        }
      }),
    )
  }

  private async addProduct(newProduct: ProductAddedEvent['data']) {
    const {
      spring: { stock, ...spring },
      price,
      ...product
    } = newProduct

    try {
      await this.prisma.product.create({
        data: {
          ...product,
          price: {
            create: {
              ...price,
            },
          },
          spring: {
            connectOrCreate: {
              where: { id: spring.id },
              create: {
                ...spring,
                stock: {
                  create: {
                    ...stock,
                  },
                },
              },
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el product ${newProduct.code} en la db`,
      )
    }
  }
}
