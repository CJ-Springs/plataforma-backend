import { IncomeOrderStatus } from '@prisma/client'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'

import { IncomeOrder } from '../../aggregate/income-order.aggregate'
import { IncomeOrderRepository } from '../../repository/income-order.repository'
import { PlaceIncomeOrderCommand } from '../impl/place-income-order.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(PlaceIncomeOrderCommand)
export class PlaceIncomeOrderHandler
  implements ICommandHandler<PlaceIncomeOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly orderRepository: IncomeOrderRepository,
  ) {}

  async execute(command: PlaceIncomeOrderCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el PlaceIncomeOrder command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const orderOrError = IncomeOrder.create({
      userId: data.userId,
      status: IncomeOrderStatus.EN_PROGRESO,
    })
    if (orderOrError.isFailure) {
      throw new BadRequestException(orderOrError.getErrorValue())
    }
    const order = orderOrError.getValue()

    await this.orderRepository.save(order)
    this.publisher.mergeObjectContext(order).commit()

    return {
      success: true,
      status: 201,
      message: 'Orden de ingreso creada correctamente',
      data: order.toDTO(),
    }
  }

  validate(command: PlaceIncomeOrderCommand) {
    const validation = Validate.isRequired(command.data.userId, 'userId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
