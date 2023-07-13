import { Injectable } from '@nestjs/common'

import { WarrantyOrder } from '../aggregate/warranty-order.aggregate'
import { WarrantyOrderCreatedEvent } from '../events/impl/warranty-order-created.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class WarrantyOrderRepository implements IRepository<WarrantyOrder> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<WarrantyOrder>> {
    try {
      const warrantyOrder = await this.prisma.warrantyOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      })

      if (!warrantyOrder) {
        return null
      }

      return WarrantyOrder.create(warrantyOrder)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la orden de garantía ${id} en la db`,
      )
      return null
    }
  }

  async save(warrantyOrder: WarrantyOrder): Promise<void> {
    const events = warrantyOrder.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof WarrantyOrderCreatedEvent) {
          return this.createWarrantyOrder(event.data)
        }
      }),
    )
  }

  private async createWarrantyOrder(data: WarrantyOrderCreatedEvent['data']) {
    const { items, ...warrantyOrder } = data

    try {
      await this.prisma.warrantyOrder.create({
        data: { ...warrantyOrder, items: { createMany: { data: items } } },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear la orden de garantía ${data.id} en la db`,
      )
    }
  }
}
