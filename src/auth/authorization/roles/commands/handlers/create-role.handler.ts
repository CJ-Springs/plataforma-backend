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
import { StandardResponse } from '@/.shared/types'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleRepository: RoleRepository,
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateRoleCommand): Promise<StandardResponse> {
    this.logger.log('Roles', 'Ejecutando el CreateRole command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code } = data

    const existRole = await this.prisma.role.findUnique({
      where: { code },
      select: { id: true },
    })
    if (existRole) {
      throw new ConflictException(`El rol ${code} ya ha sido creado`)
    }

    let permissions = getUniqueValues<typeof data.permissions>(
      data.permissions ?? [],
    )

    if (permissions.length) {
      for await (const permission of permissions) {
        const _permission = await this.prisma.permission.findUnique({
          where: { name: permission },
          select: { id: true },
        })

        if (!_permission) {
          throw new NotFoundException(`El permiso ${permission} no existe`)
        }
      }
    }

    if (data.allPermissions) {
      permissions = await this.prisma.permission
        .findMany({
          select: { name: true },
        })
        .then((permissions) => permissions.map((permission) => permission.name))
    }

    const roleOrError = Role.create({
      code,
      name: data.name,
      permissions,
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
  }

  validate(command: CreateRoleCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.name, argumentName: 'name' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
