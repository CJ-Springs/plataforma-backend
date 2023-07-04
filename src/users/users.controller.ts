import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreateUserDto } from './dtos'
import { UsersService } from './users.service'
import { CreateUserCommand } from './commands/impl/create-user.command'
import { ChangeUserStatusCommand } from './commands/impl/change-user-status.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly userService: UsersService,
  ) {}

  @RequiredPermissions('backoffice::crear-usuario')
  @UseGuards(PermissionGuard)
  @Post()
  async createUser(@Body() newUser: CreateUserDto) {
    const { email, role, ...profile } = newUser
    return await this.commandBus.execute(
      new CreateUserCommand({ email, role, profile }),
    )
  }

  @RequiredPermissions('backoffice::cambiar-estado-usuario')
  @UseGuards(PermissionGuard)
  @Patch(':ID/cambiar-estado')
  async changeUserStatus(@Param('ID') id: string) {
    return await this.commandBus.execute(new ChangeUserStatusCommand({ id }))
  }

  @RequiredPermissions('backoffice::eliminar-usuario')
  @UseGuards(PermissionGuard)
  @Delete(':ID')
  async deleteUser(@Param('ID') id: string) {
    return await this.userService.deleteUser(id)
  }
}
