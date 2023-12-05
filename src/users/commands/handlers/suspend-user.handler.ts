import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { UserRepository } from '../../repository/user.repository'
import { SuspendUserCommand } from '../impl/suspend-user.command'
import { Result, Validate, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(SuspendUserCommand)
export class SuspendUserHandler implements ICommandHandler<SuspendUserCommand> {
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: SuspendUserCommand): Promise<StandardResponse> {
    this.logger.log('Users', 'Ejecutando el SuspendUser command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { userId },
    } = command

    const userOrNull = await this.userRepository.findOneById(userId)
    if (!userOrNull) {
      throw new NotFoundException(`No se ha encontrado el usuario ${userId}`)
    }
    const user = userOrNull.getValue()

    const suspendUserResult = user.suspend()
    if (suspendUserResult.isFailure) {
      throw new BadRequestException(suspendUserResult.getErrorValue())
    }

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      status: 200,
      message: `El usuario ${user.props.email.getValue()} se ha suspendido`,
      data: user.toDTO(),
    }
  }

  validate(command: SuspendUserCommand) {
    const validation = Validate.isRequired(command.data.userId, 'userId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
