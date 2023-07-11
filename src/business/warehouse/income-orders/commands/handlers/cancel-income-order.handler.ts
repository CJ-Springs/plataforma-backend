import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { IncomeOrderRepository } from '../../repository/income-order.repository'
import { CancelIncomeOrderCommand } from '../impl/cancel-income-order.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(CancelIncomeOrderCommand)
export class CancelIncomeOrderHandler
  implements ICommandHandler<CancelIncomeOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly orderRepository: IncomeOrderRepository,
  ) {}

  async execute(command: CancelIncomeOrderCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el CancelIncomeOrder command handler')

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

    const cancelOrderResult = order.cancelOrder()
    if (cancelOrderResult.isFailure) {
      throw new ConflictException(cancelOrderResult.getErrorValue())
    }

    await this.orderRepository.save(order)
    this.publisher.mergeObjectContext(order).commit()

    return {
      success: true,
      status: 200,
      message: `Orden de ingreso ${orderId} anulada correctamente`,
    }
  }

  validate(command: CancelIncomeOrderCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.orderId, argumentName: 'orderId' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
