import { Injectable } from '@nestjs/common'
import { genSalt, hash } from 'bcrypt'

import { User } from '../aggregate/user.aggregate'
import { UserCreatedEvent } from '../events/impl/user-created.event'
import { UserPasswordChangedEvent } from '../events/impl/user-password-changed'
import { UserRolesUpdatedEvent } from '../events/impl/user-roles-updated.event'
import { UserActivatedEvent } from '../events/impl/user-activated.event'
import { UserSuspendedEvent } from '../events/impl/user-suspended.event'
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
          roles: { select: { code: true } },
        },
      })

      if (!user) {
        return null
      }
      if (user.deleted) {
        return null
      }

      const { password, roles } = user

      return User.create({
        ...user,
        password: password.passwordHash,
        profile: {
          ...user.profile,
        },
        roles: roles.map((rol) => rol.code),
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
          return this.createUser(event.data)
        }
        if (event instanceof UserActivatedEvent) {
          return this.activateUser(event.data)
        }
        if (event instanceof UserSuspendedEvent) {
          return this.suspendUser(event.data)
        }
        if (event instanceof UserPasswordChangedEvent) {
          return this.changeUserPassword(event.data)
        }
        if (event instanceof UserRolesUpdatedEvent) {
          return this.updateUserRoles(event.data)
        }
      }),
    )
  }

  private async createUser(newUser: UserCreatedEvent['data']) {
    const { password, profile, roles, ...user } = newUser
    const passwordHash = await this.useHash(password)

    try {
      await this.prisma.user.create({
        data: {
          ...user,
          password: {
            create: {
              passwordHash,
            },
          },
          profile: {
            create: {
              ...profile,
            },
          },
          roles: {
            connect: roles.map((rol) => ({ code: rol })),
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

  private async activateUser(data: UserActivatedEvent['data']) {
    const { userId } = data

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isSuspended: false,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar activar el usuario ${userId} en la db`,
      )
    }
  }

  private async suspendUser(data: UserSuspendedEvent['data']) {
    const { userId } = data

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar suspender el usuario ${userId} en la db`,
      )
    }
  }

  private async changeUserPassword(data: UserPasswordChangedEvent['data']) {
    const { id, password } = data
    const passwordHash = await this.useHash(password)

    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          password: {
            update: {
              passwordHash,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar cambiar la contraseña del usuario ${id} en la db`,
      )
    }
  }

  private async updateUserRoles(data: UserRolesUpdatedEvent['data']) {
    const { userId, newRoles, removedRoles } = data

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            connect: newRoles.map((role) => ({ code: role })),
            disconnect: removedRoles.map((role) => ({ code: role })),
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar actualizar los roles del usuario ${userId} en la db`,
      )
    }
  }

  private async useHash(value: string, rounds = 10): Promise<string> {
    const salt = await genSalt(rounds)
    const hashedValue = await hash(value, salt)

    return hashedValue
  }
}
