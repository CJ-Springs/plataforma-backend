import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { IncomeOrderRepository } from '../../repository/income-order.repository'
import { ConfirmIncomeOrderCommand } from '../impl/confirm-income-order.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ConfirmIncomeOrderCommand)
export class ConfirmIncomeOrderHandler
  implements ICommandHandler<ConfirmIncomeOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly orderRepository: IncomeOrderRepository,
  ) {}

  async execute(command: ConfirmIncomeOrderCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el ConfirmIncomeOrder command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { orderId },
    } = command

    const orderOrNull = await this.orderRepository.findOneById(orderId)
    if (!orderOrNull) {
      throw new NotFoundException(
        `Orden de ingreso con id ${orderId} no encontrada`,
      )
    }
    const order = orderOrNull.getValue()

    const confirmOrderResult = order.confirmOrder()
    if (confirmOrderResult.isFailure) {
      throw new ConflictException(confirmOrderResult.getErrorValue())
    }

    await this.orderRepository.save(order)
    this.publisher.mergeObjectContext(order).commit()

    return {
      success: true,
      status: 200,
      message: `Orden de ingreso ${orderId} concretada`,
    }
  }

  validate(command: ConfirmIncomeOrderCommand) {
    const validation = Validate.isRequired(command.data.orderId, 'orderId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
