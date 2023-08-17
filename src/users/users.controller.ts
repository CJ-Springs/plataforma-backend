import { AppRole } from '@prisma/client'
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Headers,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommandBus } from '@nestjs/cqrs'
import * as crypto from 'crypto'

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
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  @RequiredPermissions('backoffice::crear-usuario')
  @UseGuards(PermissionGuard)
  @Post()
  async createUser(
    @Headers() headers: Record<string, string>,
    @Body() newUser: CreateUserDto,
  ) {
    const { email, roles, ...profile } = newUser

    if (roles.includes(AppRole.SUPER_ADMIN)) {
      const secretInReq = headers['x-application-secret']
      if (!secretInReq) {
        throw new BadRequestException(
          `No se puede crear un usuario ${AppRole.SUPER_ADMIN}`,
        )
      }

      const appSecret = this.configService.get('APPLICATION_SECRET')
      if (!appSecret) {
        throw new InternalServerErrorException(
          'The application does not provide an application secret',
        )
      }

      const a = Buffer.from(appSecret)
      const b = Buffer.from(secretInReq)

      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new BadRequestException(
          `Error al crear un usuario ${AppRole.SUPER_ADMIN}: Las credenciales son inválidas`,
        )
      }
    }

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
    if (roles.includes(AppRole.SUPER_ADMIN)) {
      throw new BadRequestException(
        `El rol de un usuario no puede ser actualizado a ${AppRole.SUPER_ADMIN}`,
      )
    }

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
