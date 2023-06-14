import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { JwtPayload } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    const { id } = payload

    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`)
    }
    if (user.deleted) {
      throw new UnauthorizedException(
        `El usuario con id ${id} ha sido eliminado`,
      )
    }
    if (user.isSuspended) {
      throw new UnauthorizedException(`El usuario con id ${id} está suspendido`)
    }

    return user
  }
}
