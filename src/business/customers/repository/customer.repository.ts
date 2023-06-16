import { Injectable } from '@nestjs/common'

import { Customer } from '../aggregate/customer.aggregate'
import { CustomerRegisteredEvent } from '../events/impl/customer-registered.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class CustomerRepository implements IRepository<Customer> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Customer>> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          address: true,
        },
      })

      if (!customer) {
        return null
      }

      return Customer.create(customer)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el cliente ${id} en la db`,
      )
      return null
    }
  }

  async save(customer: Customer): Promise<void> {
    const events = customer.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof CustomerRegisteredEvent) {
          return this.registerCustomer(event.data)
        }
      }),
    )
  }

  private async registerCustomer(newCustomer: CustomerRegisteredEvent['data']) {
    const { address, ...customer } = newCustomer

    try {
      await this.prisma.customer.create({
        data: {
          ...customer,
          address: {
            create: {
              ...address,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el cliente ${newCustomer.email} en la db`,
      )
    }
  }
}
