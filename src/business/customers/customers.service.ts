import { BadRequestException, Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import * as Papa from 'papaparse'

import { LoggerService } from '@/.shared/helpers'
import { Types } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { CustomerRegisteredEvent } from './events/impl/customer-registered.event'

@Injectable()
export class CustomersService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  parseCustomersFromCSVFile(file: Buffer): ParsedCustomer[] {
    this.logger.log('customers', 'Parsing CSV file', {
      logType: 'service',
    })

    const { data } = Papa.parse(file.toString())
    const [keys, ...customers] = data as Array<string[]>

    const allKeysMustBeIncluded = customerFields
      .map((field) => field.key)
      .every((key) => keys.includes(key))

    if (!allKeysMustBeIncluded || customerFields.length < keys.length) {
      throw new BadRequestException(
        'Faltan o sobran campos en el archivo enviado',
      )
    }

    const parseCustomers = customers.reduce<ParsedCustomer[]>(
      (acc, csvValues) => {
        const customer = csvValues.reduce<any>((acc, value, i) => {
          let actualValue: any = value
          const field = customerFields.find((field) => field.key === keys[i])

          if (value === '' && field.type !== 'boolean') actualValue = null
          else if (field.type === 'number') actualValue = Number(value)
          else if (field.type === 'boolean') actualValue = Boolean(value)

          return { ...acc, [field.key]: actualValue }
        }, {})

        acc.push(customer)

        return acc
      },
      [],
    )

    return parseCustomers
  }

  async registerBulkCustomers(customers: ParsedCustomer[]) {
    this.logger.log('customers', 'Bulk Inserting Customers', {
      logType: 'service',
    })

    const failedCustomers = []
    const successfulCustomers = []

    for await (const cust of customers) {
      const { address, city, locality, province, ...customer } = cust

      try {
        const createdCustomer = await this.prisma.customer.create({
          data: {
            ...customer,
            discount: customer.discount || null,
            balance: 0,
            address: {
              create: {
                province,
                city,
                locality,
                address,
              },
            },
          },
          include: { address: true },
        })

        this.eventBus.publish(new CustomerRegisteredEvent(createdCustomer))

        successfulCustomers.push({ code: customer.code })
      } catch (err) {
        this.logger.error(
          `Error creando el cliente ${customer.code}`,
          'Customers',
        )
        console.log({ ...err })

        failedCustomers.push({ code: customer.code, error: { ...err } })
      }
    }

    return {
      success: !failedCustomers.length,
      message: `Se crearon ${successfulCustomers.length} clientes`,
      successful: successfulCustomers,
      failed: failedCustomers,
    }
  }
}

type ParsedCustomer = {
  code: number
  email: string
  name: string
  phone: string
  paymentDeadline: number
  discount?: number
  cuil?: string
  province: string
  city: string
  locality?: string
  address: string
}

const customerFields: { key: keyof ParsedCustomer; type: Types }[] = [
  {
    key: 'code',
    type: 'number',
  },
  {
    key: 'email',
    type: 'string',
  },
  {
    key: 'name',
    type: 'string',
  },
  {
    key: 'phone',
    type: 'string',
  },
  {
    key: 'paymentDeadline',
    type: 'number',
  },
  {
    key: 'discount',
    type: 'number',
  },
  {
    key: 'cuil',
    type: 'string',
  },
  {
    key: 'province',
    type: 'string',
  },
  {
    key: 'city',
    type: 'string',
  },
  {
    key: 'locality',
    type: 'string',
  },
  {
    key: 'address',
    type: 'string',
  },
]
