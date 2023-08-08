import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { MinStockUpdateCommand } from '../impl/min-stock-update.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(MinStockUpdateCommand)
export class MinStockUpdateHandler
  implements ICommandHandler<MinStockUpdateCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: MinStockUpdateCommand): Promise<StandardResponse> {
    this.logger.log('Springs', 'Ejecutando el MinStockUpdate command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, update } = data

    const existingSpring = await this.prisma.spring.findUnique({
      where: { code },
      select: { id: true },
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
          minQuantity: update,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Al actualizar el stock mínimo del espiral ${code}`,
      )
      throw new BadRequestException(
        `Error durante la actualización del stock mínimo del espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Stock mínimo del espiral ${code} actualizado a ${update}`,
    }
  }

  validate(command: MinStockUpdateCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.update, argumentName: 'update' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    const minQuantityValidation = Validate.isGreaterOrEqualThan(
      command.data.update,
      0,
      'adjustment',
    )

    if (minQuantityValidation.isFailure) {
      return Result.fail<string>(minQuantityValidation.getErrorValue())
    }

    return Result.ok()
  }
}
