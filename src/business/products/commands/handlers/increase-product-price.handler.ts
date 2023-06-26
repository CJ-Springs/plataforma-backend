import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { ProductRepository } from '../../repository/product.repository'
import { IncreaseProductPriceCommand } from '../impl/increase-product-price.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(IncreaseProductPriceCommand)
export class IncreaseProductPriceHandler
  implements ICommandHandler<IncreaseProductPriceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    command: IncreaseProductPriceCommand,
  ): Promise<StandardResponse> {
    this.logger.log('Ejecutando el IncreaseProductPrice command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const productOrNull = await this.productRepository.findOneByUniqueInput({
      code: data.code,
    })
    if (!productOrNull) {
      throw new NotFoundException(
        `No se ha encontrado un producto con el código ${data.code}`,
      )
    }
    const product = productOrNull.getValue()

    product.increasePrice(data.percentage)

    await this.productRepository.save(product)
    this.publisher.mergeObjectContext(product).commit()

    return {
      success: true,
      status: 200,
      message: `Precio del producto ${data.code} aumentado un ${data.percentage}`,
      data: product.toDTO(),
    }
  }

  validate(command: IncreaseProductPriceCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.percentage, argumentName: 'percentage' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
