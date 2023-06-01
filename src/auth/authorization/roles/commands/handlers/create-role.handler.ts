import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { BadRequestException, HttpException } from '@nestjs/common'

import { CreateRoleCommand } from '../impl/create-role.command'
import { Role } from '../../aggregate/role.model'
import { RoleRepository } from '../../repository/role.repository'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(private readonly repository: RoleRepository) {}

  async execute(command: CreateRoleCommand) {
    const { data } = command
    const roleOrError = Role.create({ ...data })

    if (roleOrError.isFailure) {
      throw new BadRequestException(roleOrError.getErrorValue())
    }

    const role = roleOrError.getValue()

    const createdRole = await this.repository.save(role.props)

    if (createdRole.isFailure && createdRole.error instanceof HttpException) {
      throw createdRole.getErrorValue()
    }

    return {
      success: true,
      status: 201,
      message: 'Rol creado correctamente',
      data: createdRole.getValue().toDTO(),
    }
  }
}
