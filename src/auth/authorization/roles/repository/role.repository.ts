import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { IFindByUniqueInput, IRepository } from '@/.shared/types'
import { Result } from '@/.shared/helpers'
import { Role } from '../aggregate/role.aggregate'
import { RoleCreatedEvent } from '../events/impl/role-created.event'
import { PermissionAssigned } from '../events/impl/permission-assigned.event'

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
      const _role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!_role) {
        return null
      }

      const role = Role.create({
        id: _role.id,
        role: _role.role,
        permissions: _role.permissions.map((permission) => permission.name),
      })

      return Result.ok<Role>(role.getValue())
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
      const _role = await this.prisma.role.findUnique({
        where,
        include: { permissions: { select: { name: true } } },
      })

      if (!_role) {
        return null
      }

      const role = Role.create({
        id: _role.id,
        role: _role.role,
        permissions: _role.permissions.map((permission) => permission.name),
      })

      return Result.ok<Role>(role.getValue())
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
          const { data } = event

          return this.createRole(data)
        }

        if (event instanceof PermissionAssigned) {
          const { data } = event

          return this.assignPermission(data)
        }
      }),
    )
  }

  private async createRole({
    id,
    role,
    permissions,
  }: RoleCreatedEvent['data']) {
    try {
      const _permissions = permissions.map((permission) => ({
        name: permission,
      }))

      await this.prisma.role.create({
        data: {
          id,
          role,
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
        where: { role },
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
