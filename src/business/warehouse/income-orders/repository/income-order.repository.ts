import { Injectable } from '@nestjs/common'

import { IncomeOrder } from '../aggregate/income-order.aggregate'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { IncomeOrderPlacedEvent } from '../events/impl/income-order-placed.event'

@Injectable()
export class IncomeOrderRepository implements IRepository<IncomeOrder> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<IncomeOrder>> {
    try {
      const incomeOrder = await this.prisma.incomeOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      })

      if (!incomeOrder) {
        return null
      }

      return IncomeOrder.create(incomeOrder)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la orden de ingreso ${id} en la db`,
      )
      return null
    }
  }

  async save(incomeOrder: IncomeOrder): Promise<void> {
    const events = incomeOrder.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof IncomeOrderPlacedEvent) {
          return this.createIncomeOrder(event.data)
        }
      }),
    )
  }

  private async createIncomeOrder(data: IncomeOrderPlacedEvent['data']) {
    const { items, ...incomeOrder } = data

    try {
      await this.prisma.incomeOrder.create({
        data: { ...incomeOrder, items: { createMany: { data: items } } },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear la orden de ingreso ${data.id} en la db`,
      )
    }
  }
}
