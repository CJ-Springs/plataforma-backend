import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { AssignPermissionCommand } from '../impl/assign-permission'
import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(AssignPermissionCommand)
export class AssignPermissionHandler
  implements ICommandHandler<AssignPermissionCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: AssignPermissionCommand): Promise<StandardResponse> {
    this.logger.log('Roles', 'Ejecutando el AssignPermission command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const existPermission = await this.prisma.permission.findUnique({
      where: { name: data.permission },
      select: { id: true, name: true, description: true },
    })
    if (!existPermission) {
      throw new NotFoundException(
        `El permiso ${data.permission} no se ha encontrado`,
      )
    }

    const roleOrNull = await this.roleRepository.findOneByUniqueInput({
      code: data.role,
    })
    if (!roleOrNull) {
      throw new NotFoundException(`El rol ${data.role} no se ha encontrado`)
    }
    const role = roleOrNull.getValue()

    const addPermissionResult = role.addPermission({
      permission: data.permission,
    })
    if (addPermissionResult.isFailure) {
      throw new BadRequestException(addPermissionResult.getErrorValue())
    }

    await this.roleRepository.save(role)
    this.publisher.mergeObjectContext(role).commit()

    return {
      success: true,
      status: 200,
      message: `Permiso asignado al rol ${data.role}`,
    }
  }

  validate(command: AssignPermissionCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.permission, argumentName: 'permission' },
      { argument: command.data.role, argumentName: 'role' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
