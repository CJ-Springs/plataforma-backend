import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { IncrementStockCommand } from '../impl/increment-stock.command'
import { StockIncrementedEvent } from '../../events/impl/stock-incremented.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(IncrementStockCommand)
export class IncrementStockHandler
  implements ICommandHandler<IncrementStockCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: IncrementStockCommand): Promise<StandardResponse> {
    this.logger.log('Springs', 'Ejecutando el IncrementStock command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, entered, reason } = data

    const existingSpring = await this.prisma.spring.findUnique({
      where: { code },
      select: {
        id: true,
        stock: { select: { quantityOnHand: true } },
      },
    })
    if (!existingSpring) {
      throw new NotFoundException(`El espiral ${code} no existe`)
    }

    try {
      const updatedStock = existingSpring.stock.quantityOnHand + entered

      await this.prisma.stock.update({
        where: {
          springId: existingSpring.id,
        },
        data: {
          quantityOnHand: { increment: entered },
        },
      })

      this.eventBus.publish(
        new StockIncrementedEvent({
          code,
          reason,
          quantity: entered,
          updatedStock,
        }),
      )
    } catch (error) {
      this.logger.error(error, `Al incrementar el stock del espiral ${code}`)
      throw new BadRequestException(
        `Error durante al incrementar el stock del espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Han ingresado ${entered} juegos del espiral ${code}`,
    }
  }

  validate(command: IncrementStockCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.reason, argumentName: 'reason' },
      { argument: command.data.entered, argumentName: 'entered' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    const enteredValidation = Validate.isGreaterOrEqualThan(
      command.data.entered,
      0,
      'entered',
    )

    if (enteredValidation.isFailure) {
      return Result.fail<string>(enteredValidation.getErrorValue())
    }

    return Result.ok()
  }
}
