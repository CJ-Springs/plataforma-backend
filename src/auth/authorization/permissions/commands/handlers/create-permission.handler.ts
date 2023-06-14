import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { CreatePermissionCommand } from '../impl/create-permission.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { getUniqueValues } from '@/.shared/utils/getUniqueValues'
import { Permission } from '../../aggregate/permission.aggregate'
import { PermissionRepository } from '../../repository/permission.repository'

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler
  implements ICommandHandler<CreatePermissionCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly permissionRepository: PermissionRepository,
    private readonly publisher: EventPublisher,
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
      select: { id: true },
    })

    if (!existPermission) {
      if (data.roles) {
        const { roles } = data
        const uniqueRoles = getUniqueValues<typeof roles>(roles)

        for await (const _role of uniqueRoles) {
          const existRole = await this.prisma.role.findUnique({
            where: { role: _role },
            select: { id: true },
          })

          if (!existRole) {
            throw new NotFoundException(`El rol ${_role} no se ha encontrado`)
          }
        }
      }

      const permissionOrError = Permission.create({
        name: data.name,
        description: data.description,
        roles: getUniqueValues(data.roles ?? []),
      })

      if (permissionOrError.isFailure) {
        throw new BadRequestException(permissionOrError.getErrorValue())
      }

      const permission = permissionOrError.getValue()

      await this.permissionRepository.save(permission)

      this.publisher.mergeObjectContext(permission).commit()

      return {
        success: true,
        status: 201,
        message: 'Permiso creado correctamente',
        data: permission.toDTO(),
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
