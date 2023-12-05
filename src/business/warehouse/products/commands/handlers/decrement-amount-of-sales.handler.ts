import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'

import { DecrementAmountOfSalesCommand } from '../impl/decrement-amount-of-sales.command'
import { AmountOfSalesDecrementedEvent } from '../../events/impl/amount-of-sales-decremented.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(DecrementAmountOfSalesCommand)
export class DecrementAmountOfSalesHandler
  implements ICommandHandler<DecrementAmountOfSalesCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: DecrementAmountOfSalesCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Products',
      'Ejecutando el DecrementAmountOfSales command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const { amountOfSales } = await this.prisma.product.update({
      where: {
        code: data.code,
      },
      data: { amountOfSales: { decrement: data.reduction } },
      select: { amountOfSales: true },
    })

    this.eventBus.publish(
      new AmountOfSalesDecrementedEvent({
        code: data.code,
        reduction: data.reduction,
        amountOfSales,
      }),
    )

    return {
      success: true,
      status: 200,
      message: `El producto ${data.code} ha disminuido en ${data.reduction} su número de ventas`,
    }
  }

  validate(command: DecrementAmountOfSalesCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.reduction, argumentName: 'reduction' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
