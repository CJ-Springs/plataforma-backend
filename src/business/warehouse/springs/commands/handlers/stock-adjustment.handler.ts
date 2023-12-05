import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { StockAdjustmentCommand } from '../impl/stock-adjustment.command'
import { StockAdjustedEvent } from '../../events/impl/stock-adjusted.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(StockAdjustmentCommand)
export class StockAdjustmentHandler
  implements ICommandHandler<StockAdjustmentCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StockAdjustmentCommand): Promise<StandardResponse> {
    this.logger.log(
      'Springs',
      'Ejecutando el StockAdjustment command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, adjustment } = data

    const existingSpring = await this.prisma.spring.findUnique({
      where: { code },
      select: { id: true, stock: true },
    })
    if (!existingSpring) {
      throw new NotFoundException(`El espiral ${code} no existe`)
    }

    try {
      await this.prisma.stock.update({
        where: {
          springId: existingSpring.id,
        },
        data: {
          quantityOnHand: { set: adjustment },
        },
      })

      this.eventBus.publish(
        new StockAdjustedEvent({
          code,
          prevStock: existingSpring.stock.quantityOnHand,
          quantity: Math.abs(existingSpring.stock.quantityOnHand - adjustment),
          updatedStock: adjustment,
        }),
      )
    } catch (error) {
      this.logger.error(error, `Al actualizar el stock del espiral ${code}`)
      throw new BadRequestException(
        `Error durante la actualización del stock del espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Stock del espiral ${code} actualizado a ${adjustment}`,
    }
  }

  validate(command: StockAdjustmentCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.adjustment, argumentName: 'adjustment' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    const adjustmentValidation = Validate.isGreaterOrEqualThan(
      command.data.adjustment,
      0,
      'adjustment',
    )

    if (adjustmentValidation.isFailure) {
      return Result.fail<string>(adjustmentValidation.getErrorValue())
    }

    return Result.ok()
  }
}
