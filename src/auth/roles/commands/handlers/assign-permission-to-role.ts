import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { AssignPermissionToRoleCommand } from '../impl/assign-permission-to-role'
import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { getUniqueValues } from '@/.shared/utils/getUniqueValues'

@CommandHandler(AssignPermissionToRoleCommand)
export class AssignPermissionToRoleHandler
  implements ICommandHandler<AssignPermissionToRoleCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: AssignPermissionToRoleCommand) {
    this.logger.log('Ejecutando el AssignPermissionToRole command handler')

    const validateCommand = this.validate(command)

    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const existPermission = await this.prisma.permission.findUnique({
      where: { name: data.permission },
      select: { id: true, name: true, description: true },
    })

    if (existPermission) {
      const { roles } = data
      const uniqueRoles = getUniqueValues<typeof roles>(roles)

      for await (let _role of uniqueRoles) {
        const roleOrNull = await this.roleRepository.findOneByUniqueInput({
          role: _role,
        })

        if (!roleOrNull) {
          throw new NotFoundException(`El rol ${_role} no ha sido creado`)
        }

        const role = roleOrNull.getValue()

        const permissionAddedResult = role.addPermission({
          id: existPermission.id,
          name: existPermission.name,
          description: existPermission.description,
        })

        if (permissionAddedResult.isFailure) {
          throw new BadRequestException(permissionAddedResult.getErrorValue())
        }

        await this.roleRepository.update(permissionAddedResult.getValue().props)
      }

      return {
        success: true,
        statusCode: 200,
        message: `Permiso asignado al rol/es ${uniqueRoles.join(', ')}`,
      }
    } else {
      throw new NotFoundException(
        `El permiso ${data.permission} no ha encontrado`,
      )
    }
  }

  validate(command: AssignPermissionToRoleCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.permission, argumentName: 'permission' },
      { argument: command.data.roles, argumentName: 'roles' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
