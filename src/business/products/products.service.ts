import { Injectable, NotFoundException } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { IncreaseBulkProductsPriceDto } from './dtos'
import { IncreaseProductPriceCommand } from './commands/impl/increase-product-price.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async increaseBulkProductsPrice({
    percentage,
    type,
  }: IncreaseBulkProductsPriceDto): Promise<StandardResponse> {
    const products = await this.prisma.product.findMany({
      where: { type },
      select: { code: true },
    })

    if (!products.length) {
      throw new NotFoundException(
        `No se han encontrado productos del tipo ${type}`,
      )
    }

    for await (const product of products) {
      await this.commandBus.execute(
        new IncreaseProductPriceCommand({
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
