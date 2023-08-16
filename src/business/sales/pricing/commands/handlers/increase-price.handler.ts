import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { PricingRepository } from '../../repository/pricing.repository'
import { IncreasePriceCommand } from '../impl/increase-price.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(IncreasePriceCommand)
export class IncreasePriceHandler
  implements ICommandHandler<IncreasePriceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly pricingRepository: PricingRepository,
  ) {}

  async execute(command: IncreasePriceCommand): Promise<StandardResponse> {
    this.logger.log('Pricing', 'Ejecutando el IncreasePrice command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const priceOrNull = await this.pricingRepository.findOneById(data.code)
    if (!priceOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el producto con el código #${data.code}`,
      )
    }
    const price = priceOrNull.getValue()

    price.increaseByPercentage(data.percentage)

    await this.pricingRepository.save(price)
    this.publisher.mergeObjectContext(price).commit()

    return {
      success: true,
      status: 200,
      message: `Precio del producto #${data.code} aumentado un ${data.percentage}%`,
      data: price.toDTO(),
    }
  }

  validate(command: IncreasePriceCommand) {
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
