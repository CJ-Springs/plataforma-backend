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
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    const { id } = payload

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    })
    if (!user) {
      throw new NotFoundException('Usuario inexistente')
    }
    if (user.deleted) {
      throw new UnauthorizedException('Este usuario ha sido eliminado')
    }
    if (user.isSuspended) {
      throw new UnauthorizedException(`Su usuario se encuentra suspendido`)
    }

    return user
  }
}
