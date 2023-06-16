import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreatePermissionDto } from './dtos'
import { CreatePermissionCommand } from './commands/impl/create-permission.command'
import { PermissionGuard, RequiredPermissions } from '../guards'

@Controller('permisos')
export class PermissionsController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::crear-permiso')
  @UseGuards(PermissionGuard)
  @Post()
  async createPermission(@Body() newPermission: CreatePermissionDto) {
    return await this.commandBus.execute(
      new CreatePermissionCommand(newPermission),
    )
  }
}
