import { Body, Controller, Post } from '@nestjs/common'

import { CreateRoleDto } from './dtos'
import { CommandBus } from '@nestjs/cqrs'
import { CreateRoleCommand } from './commands/impl/create-role.command'

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
}
