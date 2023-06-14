import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { compare } from 'bcrypt'

import { LoginDto, StepOneDto, StepThreeDto, StepTwoDto } from './dtos'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from '@/.shared/types'
import { ONE_MINUTE, getNumericCode } from '@/.shared/utils'
import { ChangeUserPasswordCommand } from '@/users/commands/impl/change-user-password.command'

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus,
  ) {}

  async login({ email, password }: LoginDto) {
    const existUser = await this.prisma.user
      .findUniqueOrThrow({
        where: { email },
        include: { password: true, profile: true, role: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al usuario con email ${email}`,
        )
      })

    if (existUser) {
      if (existUser.deleted) {
        throw new BadRequestException(`El usuario ${email} ha sido eliminado`)
      }

      const match = await compare(password, existUser.password.passwordHash)

      if (!match) {
        throw new BadRequestException('Las credenciales son inválidas')
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async generateRecoveryCode({ email }: StepOneDto) {
    const existUser = await this.prisma.user
      .findUniqueOrThrow({
        where: { email },
        select: { id: true, deleted: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al usuario con email ${email}`,
        )
      })

    if (existUser.deleted) {
      throw new BadRequestException(`El usuario ${email} ha sido eliminado`)
    }

    const expiresAt = new Date().getTime() + ONE_MINUTE * 15
    const generatedCode = getNumericCode()

    const code = await this.prisma.code.create({
      data: {
        code: generatedCode,
        expiresAt: new Date(expiresAt),
        user: {
          connect: {
            email,
          },
        },
      },
    })

    //TODO: no enviar el código en la response, por email

    return {
      success: true,
      statusCode: 200,
      message: `Código enviado al email ${email}`,
      data: code,
    }
  }

  async validateCode({ email, code }: StepTwoDto) {
    const existUser = await this.prisma.user
      .findUniqueOrThrow({
        where: { email },
        select: { id: true, deleted: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al usuario con email ${email}`,
        )
      })

    if (existUser.deleted) {
      throw new BadRequestException(`El usuario ${email} ha sido eliminado`)
    }

    const _code = await this.prisma.code.findFirst({
      where: { user: { email }, used: false, code },
      orderBy: {
        createdAt: 'desc',
      },
    })
    if (!_code) {
      throw new BadRequestException('El código ingresado no es válido')
    }
    if (_code.expiresAt < new Date()) {
      throw new BadRequestException('El código ha expirado')
    }

    return {
      success: true,
      statusCode: 200,
      message: `Código válido`,
    }
  }

  async useRecoveryCode({ code, email, password }: StepThreeDto) {
    const existUser = await this.prisma.user
      .findUniqueOrThrow({
        where: { email },
        select: { id: true, deleted: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al usuario con email ${email}`,
        )
      })
    if (existUser.deleted) {
      throw new BadRequestException(`El usuario ${email} ha sido eliminado`)
    }

    const existingCode = await this.prisma.code.findFirst({
      where: { user: { email }, used: false, code },
      orderBy: {
        createdAt: 'desc',
      },
    })
    if (!existingCode) {
      throw new BadRequestException('El código ingresado no es válido')
    }
    if (existingCode.expiresAt < new Date()) {
      throw new BadRequestException('El código ha expirado')
    }

    const res = await this.commandBus.execute(
      new ChangeUserPasswordCommand({ id: existUser.id, password }),
    )

    await this.prisma.code.update({
      where: { id: existingCode.id },
      data: { used: true },
    })

    return res
  }
}
