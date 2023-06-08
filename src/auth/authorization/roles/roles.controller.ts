import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { AssignPermissionDto, CreateRoleDto } from './dtos'
import { CreateRoleCommand } from './commands/impl/create-role.command'
import { AssignPermissionCommand } from './commands/impl/assign-permission'
import { RolesService } from './roles.service'
import { getUniqueValues } from '@/.shared/utils/getUniqueValues'

@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly rolesService: RolesService,
  ) {}

  @Get(':ID')
  async getRole(@Param('ID') ID: string) {
    return await this.rolesService.getRoleById({ id: ID })
  }

  @Post()
  async createRole(@Body() data: CreateRoleDto) {
    const { role, permissions } = data

    return await this.commandBus.execute(
      new CreateRoleCommand({ role, permissions }),
    )
  }

  @Patch('asignar-permiso')
  async assignPermission(@Body() data: AssignPermissionDto) {
    const { permission, roles } = data

    const uniqueRoles = getUniqueValues(roles)

    for await (let role of uniqueRoles) {
      await this.commandBus.execute(
        new AssignPermissionCommand({ permission, role }),
      )
    }

    return {
      success: true,
      statusCode: 200,
      message: `Permiso asignado al/los rol/es ${uniqueRoles.join(', ')}`,
    }
  }
}
