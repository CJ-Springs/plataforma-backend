import { Injectable } from '@nestjs/common'

import { Pricing } from '../aggregate/pricing.aggregate'
import { PriceIncreasedEvent } from '../events/impl/price-increased.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class PricingRepository implements IRepository<Pricing> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(code: string): Promise<Result<Pricing>> {
    try {
      const pricing = await this.prisma.productPricing.findUnique({
        where: { productCode: code },
      })

      if (!pricing) {
        return null
      }

      return Pricing.create(pricing)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el precio del producto ${code} en la db`,
      )
      return null
    }
  }

  async save(pricing: Pricing): Promise<void> {
    const events = pricing.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof PriceIncreasedEvent) {
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
