import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { Role } from '../aggregate/role.aggregate'
import { RoleCreatedEvent } from '../events/impl/role-created.event'
import { PermissionAssigned } from '../events/impl/permission-assigned.event'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService, Result } from '@/.shared/helpers'
import { IFindByUniqueInput, IRepository } from '@/.shared/types'

@Injectable()
export class RoleRepository
  implements IRepository<Role>, IFindByUniqueInput<Role>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Role> | null> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!role) {
        return null
      }

      return Role.create({
        ...role,
        permissions: role.permissions.map((permission) => permission.name),
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar encontrar el rol ${id} en la db`,
      )

      return null
    }
  }

  async findOneByUniqueInput(
    where: Prisma.RoleWhereUniqueInput,
  ): Promise<Result<Role> | null> {
    try {
      const role = await this.prisma.role.findUnique({
        where,
        include: { permissions: { select: { name: true } } },
      })

      if (!role) {
        return null
      }

      return Role.create({
        ...role,
        permissions: role.permissions.map((permission) => permission.name),
      })
    } catch (error) {
      this.logger.error(error, `Error al intentar encontrar el rol en la db`)

      return null
    }
  }

  async save(role: Role): Promise<void> {
    const events = role.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof RoleCreatedEvent) {
          return this.createRole(event.data)
        }
        if (event instanceof PermissionAssigned) {
          return this.assignPermission(event.data)
        }
      }),
    )
  }

  private async createRole(newRole: RoleCreatedEvent['data']) {
    const { permissions, ...role } = newRole

    try {
      const _permissions = permissions.map((permission) => ({
        name: permission,
      }))

      await this.prisma.role.create({
        data: {
          ...role,
          permissions: {
            connect: _permissions,
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el rol ${role} en la db`,
      )
    }
  }

  private async assignPermission({
    role,
    permission,
  }: PermissionAssigned['data']) {
    try {
      await this.prisma.role.update({
        where: { code: role },
        data: {
          permissions: {
            connect: {
              name: permission,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar asignar el permiso ${permission} al rol ${role} en la db`,
      )
    }
  }
}
