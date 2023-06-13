import { Injectable } from '@nestjs/common'
import { genSalt, hash } from 'bcrypt'

import { User } from '../aggregate/user.aggregate'
import { UserCreatedEvent } from '../events/impl/user-created.event'
import { UserStatusChangedEvent } from '../events/impl/user-status-changed'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class UserRepository implements IRepository<User> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<User>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          password: true,
          profile: true,
          role: { select: { role: true } },
        },
      })

      if (!user) {
        return null
      }

      const {
        id: userId,
        email,
        isSuspended,
        deleted,
        password,
        profile,
        role,
      } = user

      return User.create({
        id: userId,
        email,
        isSuspended,
        deleted,
        password: password.passwordHash,
        profile: {
          firstname: profile.firstname,
          lastname: profile.lastname,
          phone: profile.phone,
          document: profile.document,
        },
        role: role.role,
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el usuario ${id} en la db`,
      )
      return null
    }
  }

  async save(user: User): Promise<void> {
    const events = user.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof UserCreatedEvent) {
          const { data } = event

          return this.createUser(data)
        }
        if (event instanceof UserStatusChangedEvent) {
          const { data } = event

          return this.changeUserStatus(data)
        }
      }),
    )
  }

  private async createUser(newUser: UserCreatedEvent['data']) {
    const { id, email, password, isSuspended, profile, role } = newUser

    const salt = await genSalt(10)
    const passwordHash = await hash(password, salt)

    try {
      await this.prisma.user.create({
        data: {
          id,
          email,
          isSuspended,
          password: {
            create: {
              passwordHash,
            },
          },
          profile: {
            create: {
              firstname: profile.firstname,
              lastname: profile.lastname,
              phone: profile.phone,
              document: profile.document,
            },
          },
          role: {
            connect: {
              role,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el usuario ${newUser.email} en la db`,
      )
    }
  }

  private async changeUserStatus(data: UserStatusChangedEvent['data']) {
    const { id, isSuspended } = data

    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          isSuspended,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar cambiar el estado del usuario con id ${id} en la db`,
      )
    }
  }
}
