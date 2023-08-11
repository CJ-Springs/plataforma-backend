import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { UserRepository } from '../../repository/user.repository'
import { UpdateUserRolesCommand } from '../impl/update-user-roles.command'
import { Result, Validate, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { getUniqueValues } from '@/.shared/utils'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(UpdateUserRolesCommand)
export class UpdateUserRolesHandler
  implements ICommandHandler<UpdateUserRolesCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateUserRolesCommand): Promise<StandardResponse> {
    this.logger.log('Users', 'Ejecutando el UpdateUserRoles command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const uniqueRoles = getUniqueValues<typeof data.roles>(data.roles)

    for await (const role of uniqueRoles) {
      await this.prisma.role
        .findUniqueOrThrow({ where: { code: role } })
        .catch(() => {
          throw new NotFoundException(`No se ha encontrado el rol ${role}`)
        })
    }

    const userOrNull = await this.userRepository.findOneById(data.userId)
    if (!userOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el usuario con id ${data.userId}`,
      )
    }
    const user = userOrNull.getValue()

    const updateRolesResult = user.updateRoles(uniqueRoles)
    if (updateRolesResult.isFailure) {
      throw new BadRequestException(updateRolesResult.getErrorValue())
    }

    await this.userRepository.save(user)
    this.publisher.mergeObjectContext(user).commit()

    return {
      success: true,
      status: 200,
      message: `Roles del usuario ${user.props.email.getValue()} actualizados a: ${uniqueRoles.join(
        ', ',
      )}`,
      data: user.toDTO(),
    }
  }

  validate(command: UpdateUserRolesCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.userId, argumentName: 'userId' },
      { argument: command.data.roles, argumentName: 'roles' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
