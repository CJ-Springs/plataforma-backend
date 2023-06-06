import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { AssignPermissionDto, CreatePermissionDto, CreateRoleDto } from './dtos'
import { CreateRoleCommand } from './commands/impl/create-role.command'
import { CreatePermissionCommand } from './commands/impl/create-permission.command'
import { AssignPermissionToRoleCommand } from './commands/impl/assign-permission-to-role'
import { RolesService } from './roles.service'

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

  @Post('crear-permiso')
  async createPermission(@Body() data: CreatePermissionDto) {
    const { name, description, roles } = data

    return await this.commandBus.execute(
      new CreatePermissionCommand({ name, description, roles }),
    )
  }

  @Patch('asignar-permiso')
  async assignPermission(@Body() data: AssignPermissionDto) {
    const { permission, roles } = data

    return await this.commandBus.execute(
      new AssignPermissionToRoleCommand({ permission, roles }),
    )
  }
}
