import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { CreatePermissionCommand } from '../impl/create-permission.command'
import { Permission } from '../../aggregate/permission.aggregate'
import { PermissionRepository } from '../../repository/permission.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { Result, Validate } from '@/.shared/helpers'
import { getUniqueValues } from '@/.shared/utils/getUniqueValues'
import { StandardResponse } from '@/.shared/types'

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

  async execute(command: CreatePermissionCommand): Promise<StandardResponse> {
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
    if (existPermission) {
      throw new ConflictException(`El permiso ${data.name} ya fue creado`)
    }

    const uniqueRoles = getUniqueValues<typeof data.roles>(data?.roles ?? [])

    if (uniqueRoles.length) {
      for await (const role of uniqueRoles) {
        const existRole = await this.prisma.role.findUnique({
          where: { code: role },
          select: { id: true },
        })

        if (!existRole) {
          throw new NotFoundException(`El rol ${role} no se ha encontrado`)
        }
      }
    }

    const permissionOrError = Permission.create({
      ...data,
      roles: uniqueRoles,
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
