import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'

import { RegisterMovementCommand } from '../impl/register-movement.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(RegisterMovementCommand)
export class RegisterMovementHandler
  implements ICommandHandler<RegisterMovementCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: RegisterMovementCommand) {
    this.logger.log(
      'Springs',
      'Ejecutando el RegisterMovement command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, ...movement } = data

    try {
      await this.prisma.movement.create({
        data: {
          ...movement,
          spring: {
            connect: {
              code,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Al registrar un nuevo movimiento al espiral ${code}`,
      )
    }
  }

  validate(command: RegisterMovementCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.type, argumentName: 'type' },
      { argument: command.data.reason, argumentName: 'reason' },
      { argument: command.data.quantity, argumentName: 'quantity' },
      { argument: command.data.updatedStock, argumentName: 'updatedStock' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
