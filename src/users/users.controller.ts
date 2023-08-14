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

import { CreateUserDto, UpdateUserRolesDto } from './dtos'
import { UsersService } from './users.service'
import { CreateUserCommand } from './commands/impl/create-user.command'
import { ActivateUserCommand } from './commands/impl/activate-user.command'
import { SuspendUserCommand } from './commands/impl/suspend-user.command'
import { UpdateUserRolesCommand } from './commands/impl/update-user-roles.command'
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
    const { email, roles, ...profile } = newUser
    return await this.commandBus.execute(
      new CreateUserCommand({ email, roles, profile }),
    )
  }

  @RequiredPermissions('backoffice::cambiar-estado-usuario')
  @UseGuards(PermissionGuard)
  @Patch(':userId/activar')
  async activeUser(@Param('userId') userId: string) {
    return await this.commandBus.execute(new ActivateUserCommand({ userId }))
  }

  @RequiredPermissions('backoffice::cambiar-estado-usuario')
  @UseGuards(PermissionGuard)
  @Patch(':userId/suspender')
  async suspendUser(@Param('userId') userId: string) {
    return await this.commandBus.execute(new SuspendUserCommand({ userId }))
  }

  @RequiredPermissions('backoffice::actualizar-roles-usuario')
  @UseGuards(PermissionGuard)
  @Patch(':userId/actualizar-roles')
  async updateUserRoles(
    @Param('userId') userId: string,
    @Body() { roles }: UpdateUserRolesDto,
  ) {
    return await this.commandBus.execute(
      new UpdateUserRolesCommand({ userId, roles }),
    )
  }

  @RequiredPermissions('backoffice::eliminar-usuario')
  @UseGuards(PermissionGuard)
  @Delete(':ID')
  async deleteUser(@Param('ID') id: string) {
    return await this.userService.deleteUser(id)
  }
}
