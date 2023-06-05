import { Body, Controller, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreatePermissionDto, CreateRoleDto } from './dtos'
import { CreateRoleCommand } from './commands/impl/create-role.command'
import { CreatePermissionCommand } from './commands/impl/create-permission.command'

@Controller('roles')
export class RolesController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
