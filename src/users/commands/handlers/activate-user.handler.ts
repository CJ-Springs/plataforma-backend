import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { UserRepository } from '../../repository/user.repository'
import { ActivateUserCommand } from '../impl/activate-user.command'
import { Result, Validate, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler
  implements ICommandHandler<ActivateUserCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ActivateUserCommand): Promise<StandardResponse> {
    this.logger.log('Users', 'Ejecutando el ActivateUser command handler', {
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

    const activateUserResult = user.activate()
    if (activateUserResult.isFailure) {
      throw new BadRequestException(activateUserResult.getErrorValue())
    }

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      status: 200,
      message: `El usuario ${user.props.email.getValue()} se ha activado`,
      data: user.toDTO(),
    }
  }

  validate(command: ActivateUserCommand) {
    const validation = Validate.isRequired(command.data.userId, 'userId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
