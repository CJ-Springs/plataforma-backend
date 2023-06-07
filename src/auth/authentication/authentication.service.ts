import { BadRequestException, Injectable } from '@nestjs/common'
import { compare } from 'bcrypt'

import { LoginDto } from './dtos'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from '@/.shared/types'

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const existUser = await this.prisma.user
      .findUniqueOrThrow({
        where: { email },
        include: { password: true, profile: true },
      })
      .catch(() => {
        throw new BadRequestException('Las credenciales son inválidas')
      })

    if (existUser) {
      const match = await compare(password, existUser.password.passwordHash)

      if (!match) {
        throw new BadRequestException('Las credenciales son inválidas')
      }

      const { password: _password, ...user } = existUser

      const token = this.jwtService.sign({
        id: user.id,
        firstname: user.profile.firstname,
        lastname: user.profile.lastname,
      } as JwtPayload)

      return {
        success: true,
        statusCode: 200,
        message: 'Usuario logeado correctamente',
        data: {
          ...user,
          token,
        },
      }
    }
  }
}
