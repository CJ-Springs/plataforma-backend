import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { AssignPermissionDto, CreateRoleDto } from './dtos'
import { RequiredPermissions, PermissionGuard } from '../guards'
import { CreateRoleCommand } from './commands/impl/create-role.command'
import { AssignPermissionCommand } from './commands/impl/assign-permission'
import { RolesService } from './roles.service'
import { getUniqueValues } from '@/.shared/utils'

@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly rolesService: RolesService,
  ) {}

  @RequiredPermissions('backoffice::obtener-detalles-rol')
  @UseGuards(PermissionGuard)
  @Get(':ID')
  async getRole(@Param('ID') ID: string) {
    return await this.rolesService.getRoleById({ id: ID })
  }

  @RequiredPermissions('backoffice::crear-rol')
  @UseGuards(PermissionGuard)
  @Post()
  async createRole(@Body() data: CreateRoleDto) {
    const { role, permissions } = data

    return await this.commandBus.execute(
      new CreateRoleCommand({ role, permissions }),
    )
  }

  @RequiredPermissions('backoffice::asignar-permiso')
  @UseGuards(PermissionGuard)
  @Patch('asignar-permiso')
  async assignPermission(@Body() data: AssignPermissionDto) {
    const { permission, roles } = data

    const uniqueRoles = getUniqueValues(roles)

    for await (const role of uniqueRoles) {
      await this.commandBus.execute(
        new AssignPermissionCommand({ permission, role }),
      )
    }

    return {
      success: true,
      statusCode: 200,
      message: `Permiso asignado al/los rol/es ${uniqueRoles.join(', ')}`,
    }
  }
}
