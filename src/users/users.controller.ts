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
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UsersService } from './users.service'
import { CreateUserCommand } from './commands/impl/create-user.command'
import { ChangeUserStatusCommand } from './commands/impl/change-user-status.command'

@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly userService: UsersService,
  ) {}

  @RequiredPermissions('backoffice::crear-usuario')
  @UseGuards(PermissionGuard)
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    const { email, document, firstname, phone, lastname } = data

    return await this.commandBus.execute(
      new CreateUserCommand({
        email,
        document,
        firstname,
        lastname,
        phone,
        role: data?.role,
      }),
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
