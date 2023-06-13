import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { UserRepository } from '../../repository/user.repository'
import { ChangeUserPasswordCommand } from '../impl/change-user-password.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'

@CommandHandler(ChangeUserPasswordCommand)
export class ChangeUserPasswordHandler
  implements ICommandHandler<ChangeUserPasswordCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ChangeUserPasswordCommand) {
    this.logger.log('Ejecutando el ChangeUserPassword command handler')

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
    const passwordChangedResult = user.changePassword(data.password)
    if (passwordChangedResult.isFailure) {
      throw new BadRequestException(passwordChangedResult.getErrorValue())
    }

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      statusCode: 200,
      message: `Contraseña cambiada correctamente`,
    }
  }

  validate(command: ChangeUserPasswordCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.id, argumentName: 'id' },
      { argument: command.data.password, argumentName: 'password' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
