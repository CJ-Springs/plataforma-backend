import { Injectable } from '@nestjs/common'

import { Price } from '../aggregate/price.aggregate'
import { PriceIncreasedEvent } from '../events/impl/price-increased.event'
import { PriceManuallyUpdatedEvent } from '../events/impl/price-manually-updated.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class PricingRepository implements IRepository<Price> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(code: string): Promise<Result<Price>> {
    try {
      const price = await this.prisma.productPricing.findUnique({
        where: { productCode: code },
      })

      if (!price) {
        return null
      }

      return Price.create(price)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el precio del producto ${code} en la db`,
      )
      return null
    }
  }

  async save(price: Price): Promise<void> {
    const events = price.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof PriceIncreasedEvent) {
          return this.updatePrice(event.data)
        }
        if (event instanceof PriceManuallyUpdatedEvent) {
          return this.updatePrice(event.data)
        }
      }),
    )
  }

  private async updatePrice(data: { code: string; price: number }) {
    const { code, price } = data

    try {
      await this.prisma.productPricing.update({
        where: {
          productCode: code,
        },
        data: {
          price,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar actualizar el precio del producto ${code} en la db`,
      )
    }
  }
}
