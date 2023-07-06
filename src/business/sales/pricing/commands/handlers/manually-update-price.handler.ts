import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { PricingRepository } from '../../repository/pricing.repository'
import { ManuallyUpdatePriceCommand } from '../impl/manually-update-price.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ManuallyUpdatePriceCommand)
export class ManuallyUpdatePriceHandler
  implements ICommandHandler<ManuallyUpdatePriceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly pricingRepository: PricingRepository,
  ) {}

  async execute(
    command: ManuallyUpdatePriceCommand,
  ): Promise<StandardResponse> {
    this.logger.log('Ejecutando el ManuallyUpdatePrice command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const priceOrNull = await this.pricingRepository.findOneById(data.code)
    if (!priceOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el producto con el código ${data.code}`,
      )
    }
    const price = priceOrNull.getValue()

    const priceUpdatedResult = price.manuallyUpdatePrice(data.update)
    if (priceUpdatedResult.isFailure) {
      throw new BadRequestException(priceUpdatedResult.getErrorValue())
    }

    await this.pricingRepository.save(price)
    this.publisher.mergeObjectContext(price).commit()

    return {
      success: true,
      status: 200,
      message: `Precio del producto ${data.code} actualizado a ${data.update}`,
      data: price.toDTO(),
    }
  }

  validate(command: ManuallyUpdatePriceCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.update, argumentName: 'update' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
