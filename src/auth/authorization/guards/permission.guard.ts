import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { User } from '@prisma/client'

import { PERMISSIONS_KEY } from './permission.decorator'
import { RoleRepository } from '../roles/repository/role.repository'
import { LoggerService } from '@/.shared/helpers'

@Injectable()
export class PermissionGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    )

    const request = ctx.switchToHttp().getRequest()
    const user = request.user as User
    if (!user) {
      this.logger.error(
        'El PermissionGuard no puede usarse en un endpoint público',
        'Al validar el acceso en PermissionGuard',
      )

      // TODO hacer un unexpected exception
    }

    const roleOrNull = await this.roleRepository.findOneById(user.roleId)
    if (!roleOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el rol con id ${user.roleId}`,
      )
    }
    const role = roleOrNull.getValue()

    const canAccess = requiredPermissions
      .map((permission) => role.hasPermission(permission))
      .every(Boolean)

    if (!canAccess) {
      throw new UnauthorizedException(
        'No estas autorizado para realizar esta acción',
      )
    }

    return canAccess
  }
}
