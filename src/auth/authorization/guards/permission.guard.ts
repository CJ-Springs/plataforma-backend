import { Role, User } from '@prisma/client'
import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

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
    const user = request.user as User & {
      roles: Role[]
    }
    if (!user) {
      this.logger.error(
        'El PermissionGuard no puede usarse en un endpoint público',
        'Al validar el acceso en PermissionGuard',
      )

      throw new InternalServerErrorException(
        'El PermissionGuard no puede usarse en un endpoint público',
      )
    }

    const canAccess = await new Promise(async (resolve) => {
      if (!user.roles.length) return resolve(false)

      for await (const _role of user.roles) {
        const roleOrNull = await this.roleRepository.findOneByUniqueInput({
          code: _role.code,
        })
        if (!roleOrNull) {
          throw new NotFoundException(
            `No se ha encontrado el rol ${_role.code}`,
          )
        }
        const role = roleOrNull.getValue()

        // Valida que, al menos 1 de los roles del usuario, tenga alguno de los permisos requeridos

        const canAccess = requiredPermissions
          .map((permission) => role.hasPermission(permission))
          .some(Boolean)

        if (canAccess) {
          return resolve(true)
        }
      }

      return resolve(false)
    }).then((canAccess) => !!canAccess)

    if (!canAccess) {
      throw new UnauthorizedException(
        'No estas autorizado para realizar esta acción',
      )
    }

    return canAccess
  }
}
