import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreateUserDto } from './dtos'
import { CreateUserCommand } from './commands/impl/create-user.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UsersService } from './users.service'

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

  @RequiredPermissions('backoffice::eliminar-usuario')
  @UseGuards(PermissionGuard)
  @Delete(':ID')
  async deleteUser(@Param('ID') id: string) {
    return await this.userService.deleteUser(id)
  }
}
