import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, ConflictException } from '@nestjs/common'

import { CreateRoleCommand } from '../impl/create-role.command'
import { Role } from '../../aggregate/role.model'
import { RoleRepository } from '../../repository/role.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly repository: RoleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateRoleCommand) {
    this.logger.log('Ejecutando el CreateRole command handler')

    const { data } = command

    const existRole = await this.repository.findOneByUniqueInput({
      role: data.role,
    })

    if (existRole.isFailure) {
      const roleOrError = Role.create(data)

      if (roleOrError.isFailure) {
        throw new BadRequestException(roleOrError.getErrorValue())
      }

      const role = roleOrError.getValue()

      const createdRole = await this.repository.save(role.props)

      if (createdRole.isFailure) {
        throw new ConflictException(createdRole.getErrorValue())
      }

      return {
        success: true,
        status: 201,
        message: 'Rol creado correctamente',
        data: createdRole.getValue().toDTO(),
      }
    } else {
      throw new ConflictException(`El rol ${data.role} ya ha sido creado`)
    }
  }
}
