import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'

import { IncrementAmountOfSalesCommand } from '../impl/increment-amount-of-sales.command'
import { AmountOfSalesIncrementedEvent } from '../../events/impl/amount-of-sales-incremented.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(IncrementAmountOfSalesCommand)
export class IncrementAmountOfSalesHandler
  implements ICommandHandler<IncrementAmountOfSalesCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: IncrementAmountOfSalesCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Products',
      'Ejecutando el IncrementAmountOfSales command handler',
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
      data: { amountOfSales: { increment: data.increment } },
      select: { amountOfSales: true },
    })

    this.eventBus.publish(
      new AmountOfSalesIncrementedEvent({
        code: data.code,
        increment: data.increment,
        amountOfSales,
      }),
    )

    return {
      success: true,
      status: 200,
      message: `El producto ${data.code} ha aumentado en ${data.increment} su número de ventas`,
    }
  }

  validate(command: IncrementAmountOfSalesCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.increment, argumentName: 'increment' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
