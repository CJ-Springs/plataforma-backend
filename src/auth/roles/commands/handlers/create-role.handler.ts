import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { CreateRoleCommand } from '../impl/create-role.command'
import { Role } from '../../aggregate/role.model'
import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Permission } from '../../permissions/aggregate/permission.model'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { UniqueEntityID } from '@/.shared/domain'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepository: RoleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateRoleCommand) {
    this.logger.log('Ejecutando el CreateRole command handler')

    const { data } = command

    const existRole = await this.roleRepository.findOneByUniqueInput({
      role: data.role,
    })

    if (!existRole) {
      let permissions: Permission[] = []

      if (data.permissions) {
        for await (let permission_name of data.permissions) {
          const permission = await this.prisma.permission.findUnique({
            where: { name: permission_name },
            select: { id: true, name: true, description: true },
          })

          if (!permission) {
            throw new NotFoundException(
              `El permiso ${permission_name} no existe`,
            )
          }

          permissions.push(
            new Permission(
              new UniqueEntityID(permission.id),
              permission.name,
              permission.description,
            ),
          )
        }
      }

      const roleOrError = Role.create({ role: data.role, permissions })

      if (roleOrError.isFailure) {
        throw new BadRequestException(roleOrError.getErrorValue())
      }

      const role = roleOrError.getValue()

      await this.roleRepository.add(role.props)

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
}
