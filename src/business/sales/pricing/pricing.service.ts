import { Injectable, NotFoundException } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { IncreaseBulkPricesDto } from './dtos'
import { IncreasePriceCommand } from './commands/impl/increase-price.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'
import { LoggerService } from '@/.shared/helpers'

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async increaseBulkPrices({
    percentage,
    type,
  }: IncreaseBulkPricesDto): Promise<StandardResponse> {
    this.logger.log('Pricing', 'Ejecutando el método increaseBulkPrices', {
      logType: 'service',
    })

    const products = await this.prisma.product.findMany({
      where: { type },
      select: { code: true },
    })

    if (!products.length) {
      throw new NotFoundException(
        type
          ? `No se han encontrado productos del tipo ${type}`
          : 'Todavía no se ha registrado ningún producto',
      )
    }

    for await (const product of products) {
      await this.commandBus.execute(
        new IncreasePriceCommand({
          code: product.code,
          percentage,
        }),
      )
    }

    const isOneProduct = products.length === 1

    return {
      success: true,
      status: 200,
      message: `${isOneProduct ? 'El producto' : 'Los productos'} ${products
        .map((product) => product.code)
        .join(', ')} ${
        isOneProduct ? 'ha' : 'han'
      } aumentado un ${percentage}% su precio`,
    }
  }
}
