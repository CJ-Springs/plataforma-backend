import { Body, Controller, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreatePermissionDto } from './dtos'
import { CreatePermissionCommand } from './commands/impl/create-permission.command'

@Controller('permisos')
export class PermissionsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createPermission(@Body() data: CreatePermissionDto) {
    const { name, description, roles } = data

    return await this.commandBus.execute(
      new CreatePermissionCommand({ name, description, roles }),
    )
  }
}
