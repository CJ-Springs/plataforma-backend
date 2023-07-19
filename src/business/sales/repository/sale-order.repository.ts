import { Injectable } from '@nestjs/common'

import { SaleOrder } from '../aggregate/sale-order.aggregate'
import { SaleOrderPlacedEvent } from '../events/impl/sale-order-placed.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class SaleOrderRepository implements IRepository<SaleOrder> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<SaleOrder>> {
    try {
      const saleOrder = await this.prisma.saleOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      })

      if (!saleOrder) {
        return null
      }

      return SaleOrder.create(saleOrder)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la orden de venta ${id} en la db`,
      )
      return null
    }
  }

  async save(saleOrder: SaleOrder): Promise<void> {
    const events = saleOrder.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof SaleOrderPlacedEvent) {
          return this.createSaleOrder(event.data)
        }
      }),
    )
  }

  private async createSaleOrder(data: SaleOrderPlacedEvent['data']) {
    const { items, ...saleOrder } = data

    try {
      await this.prisma.saleOrder.create({
        data: { ...saleOrder, items: { createMany: { data: items } } },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear la orden de venta ${data.id} en la db`,
      )
    }
  }
}
