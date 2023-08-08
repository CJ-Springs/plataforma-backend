import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { DecrementStockCommand } from '../impl/decrement-stock.command'
import { StockDecrementedEvent } from '../../events/impl/stock-decremented.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(DecrementStockCommand)
export class DecrementStockHandler
  implements ICommandHandler<DecrementStockCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DecrementStockCommand): Promise<StandardResponse> {
    this.logger.log('Springs', 'Ejecutando el DecrementStock command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, requested, reason } = data

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
      const updatedStock = existingSpring.stock.quantityOnHand - requested

      if (updatedStock < 0) {
        throw new ConflictException(
          `Falta de stock para el espiral ${code} - stock en mano ${existingSpring.stock.quantityOnHand} - stock solicitado ${requested})`,
        )
      }

      await this.prisma.stock.update({
        where: {
          springId: existingSpring.id,
        },
        data: {
          quantityOnHand: { decrement: requested },
        },
      })

      this.eventBus.publish(
        new StockDecrementedEvent({
          code,
          reason,
          quantity: requested,
          updatedStock,
        }),
      )
    } catch (error) {
      this.logger.error(error, `Al disminuir el stock del espiral ${code}`)
      throw new BadRequestException(
        `Error al disminuir el stock del espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Se restaron ${requested} juegos del espiral ${code}`,
    }
  }

  validate(command: DecrementStockCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.reason, argumentName: 'reason' },
      { argument: command.data.requested, argumentName: 'requested' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    const requestedValidation = Validate.isGreaterOrEqualThan(
      command.data.requested,
      0,
      'requested',
    )

    if (requestedValidation.isFailure) {
      return Result.fail<string>(requestedValidation.getErrorValue())
    }

    return Result.ok()
  }
}
