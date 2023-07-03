import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CommandBus, EventBus } from '@nestjs/cqrs'
import { Cron, CronExpression } from '@nestjs/schedule'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcrypt'

import { LoginDto, StepOneDto, StepThreeDto, StepTwoDto } from './dtos'
import { RecoveryCodeGeneratedEvent } from './events/impl/recovery-code-generated.event'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { JwtPayload, StandardResponse } from '@/.shared/types'
import { ONE_MINUTE, getNumericCode } from '@/.shared/utils'
import { ChangeUserPasswordCommand } from '@/users/commands/impl/change-user-password.command'
import { LoggerService } from '@/.shared/helpers'

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async login({ email, password }: LoginDto): Promise<StandardResponse> {
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
        status: 200,
        message: 'Usuario logeado correctamente',
        data: {
          ...user,
          token,
        },
      }
    }
  }

  async generateRecoveryCode({ email }: StepOneDto): Promise<StandardResponse> {
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

    this.eventBus.publish(
      new RecoveryCodeGeneratedEvent({
        userId: existUser.id,
        email,
        code: code.code,
      }),
    )

    return {
      success: true,
      status: 200,
      message: `Código enviado al email ${email}`,
    }
  }

  async validateCode({ email, code }: StepTwoDto): Promise<StandardResponse> {
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
      where: { user: { email }, used: false },
      orderBy: {
        createdAt: 'desc',
      },
    })
    if (!existingCode) {
      throw new BadRequestException(
        'Primero genere un código de recuperación de contraseña',
      )
    }
    if (existingCode.expiresAt < new Date()) {
      throw new BadRequestException(
        'El código ha expirado. Por favor, genere uno nuevo',
      )
    }
    if (existingCode.code !== code) {
      throw new BadRequestException('El código ingresado no es válido')
    }

    return {
      success: true,
      status: 200,
      message: `Código válido`,
    }
  }

  async useRecoveryCode({
    code,
    email,
    password,
  }: StepThreeDto): Promise<StandardResponse> {
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
      where: { user: { email }, used: false },
      orderBy: {
        createdAt: 'desc',
      },
    })
    if (!existingCode) {
      throw new BadRequestException(
        'Primero genere un código de recuperación de contraseña',
      )
    }
    if (existingCode.expiresAt < new Date()) {
      throw new BadRequestException(
        'El código ha expirado. Por favor, genere uno nuevo',
      )
    }
    if (existingCode.code !== code) {
      throw new BadRequestException('El código ingresado no es válido')
    }

    const res = await this.commandBus.execute(
      new ChangeUserPasswordCommand({ id: existUser.id, password }),
    )

    await this.prisma.code.updateMany({
      where: { user: { email } },
      data: { used: true },
    })

    return res
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'Remove used or expired Recovery codes',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleCron() {
    this.logger.log(
      'Remove used or expired Recovery codes',
      'Running schedule task',
    )

    try {
      const { count } = await this.prisma.code.deleteMany({
        where: {
          OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
        },
      })

      this.logger.log(`Se eliminaron ${count} código/s`)
    } catch (error) {
      this.logger.error(
        error,
        "During the execution of 'Remove used or expired Recovery codes' task",
      )
    }
  }
}
