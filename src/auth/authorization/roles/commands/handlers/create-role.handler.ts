import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { CreateRoleCommand } from '../impl/create-role.command'
import { Role } from '../../aggregate/role.aggregate'
import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { getUniqueValues } from '@/.shared/utils/getUniqueValues'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepository: RoleRepository,
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateRoleCommand) {
    this.logger.log('Ejecutando el CreateRole command handler')

    const validateCommand = this.validate(command)

    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const existRole = await this.prisma.role.findUnique({
      where: { role: data.role },
    })

    if (!existRole) {
      if (data.permissions) {
        const { permissions: _permissions } = data
        const uniquePermissions =
          getUniqueValues<typeof _permissions>(_permissions)

        for await (const permission_name of uniquePermissions) {
          const _permission = await this.prisma.permission.findUnique({
            where: { name: permission_name },
            select: { name: true },
          })

          if (!_permission) {
            throw new NotFoundException(
              `El permiso ${permission_name} no existe`,
            )
          }
        }
      }

      const roleOrError = Role.create({
        role: data.role,
        permissions: getUniqueValues(data.permissions ?? []),
      })

      if (roleOrError.isFailure) {
        throw new BadRequestException(roleOrError.getErrorValue())
      }

      const role = roleOrError.getValue()

      await this.roleRepository.save(role)

      this.publisher.mergeObjectContext(role).commit()

      return {
        success: true,
        status: 201,
        message: 'Rol creado correctamente',
        data: role.toDTO(),
      }
    } else {
      throw new ConflictException(`El rol ${data.role} ya ha sido creado`)
    }
  }

  validate(command: CreateRoleCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.role, argumentName: 'role' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
