import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { UserRepository } from '../../repository/user.repository'
import { ChangeUserStatusCommand } from '../impl/change-user-status.command'
import { Result, Validate, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ChangeUserStatusCommand)
export class ChangeUserStatusHandler
  implements ICommandHandler<ChangeUserStatusCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ChangeUserStatusCommand): Promise<StandardResponse> {
    this.logger.log('Users', 'Ejecutando el ChangeUserStatus command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const userOrNull = await this.userRepository.findOneById(data.id)
    if (!userOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el usuario con id ${data.id}`,
      )
    }
    const user = userOrNull.getValue()
    user.changeStatus()

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      status: 200,
      message: `Usuario ${
        user.props.isSuspended ? 'suspendido' : 'activado'
      } correctamente`,
      data: user.toDTO(),
    }
  }

  validate(command: ChangeUserStatusCommand) {
    const validation = Validate.isRequired(command.data.id, 'id')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
