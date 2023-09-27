import { Role, User } from '@prisma/client'
import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { compare } from 'bcrypt'

import { LoggerService } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class RequireReAuthenticationGuard {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as User & {
      roles: Role[]
    }

    if (!user) {
      this.logger.error(
        'El RequireReAuthenticationGuard no puede usarse en un endpoint público',
        'Al validar el acceso en RequireReAuthenticationGuard',
      )

      throw new InternalServerErrorException(
        'El RequireReAuthenticationGuard no puede usarse en un endpoint público',
      )
    }

    const { password } = request.body
    if (!password) {
      throw new UnauthorizedException(
        `Para realizar esta acción, debe re autenticarse enviando su contraseña`,
      )
    }
    if (typeof password !== 'string') {
      throw new BadRequestException('La contraseña enviada debe ser un string')
    }

    const { passwordHash } = await this.prisma.password.findUnique({
      where: { userId: user.id },
      select: { passwordHash: true },
    })

    const match = await compare(password, passwordHash)
    if (!match) {
      throw new BadRequestException('La contraseña es incorrecta')
    }

    return true
  }
}
