import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { CreatePermissionCommand } from '../impl/create-permission.command'

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler
  implements ICommandHandler<CreatePermissionCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepository: RoleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreatePermissionCommand) {
    this.logger.log('Ejecutando el CreatePermission command handler')

    const validateCommand = this.validate(command)

    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const existPermission = await this.prisma.permission.findUnique({
      where: { name: data.name },
    })

    if (!existPermission) {
      const newPermission = await this.prisma.permission
        .create({
          data: {
            name: data.name,
            description: data.description,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        })
        .catch((error) => {
          this.logger.error(
            error,
            `Error al intentar crear el permiso en la db`,
          )
          throw new ConflictException(
            `Error al intentar crear el permiso en la db`,
          )
        })

      if (data.roles) {
        for await (let _role of data.roles) {
          const roleOrNull = await this.roleRepository.findOneByUniqueInput({
            role: _role,
          })

          if (!roleOrNull) {
            throw new NotFoundException(`El rol ${_role} no se ha encontrado`)
          }

          const role = roleOrNull.getValue()

          const permissionIsAdded = role.addPermission({
            id: newPermission.id,
            name: newPermission.name,
            description: newPermission.description,
          })

          if (permissionIsAdded.isFailure) {
            throw new BadRequestException(permissionIsAdded.getErrorValue())
          }

          await this.roleRepository.update(role.props)
        }
      }

      return {
        success: true,
        status: 201,
        message: 'Permiso creado correctamente',
        data: newPermission,
      }
    } else {
      throw new ConflictException(`El permiso ${data.name} ya fue creado`)
    }
  }

  validate(command: CreatePermissionCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.name, argumentName: 'name' },
      { argument: command.data.description, argumentName: 'description' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
