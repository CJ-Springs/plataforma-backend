import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { IRepository } from '@/.shared/types'
import { Result } from '@/.shared/helpers'
import { Permission } from '../aggregate/permission.aggregate'
import { PermissionCreatedEvent } from '../events/impl/permission-created.event'

@Injectable()
export class PermissionRepository implements IRepository<Permission> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Permission> | null> {
    try {
      const _permission = await this.prisma.permission.findUnique({
        where: { id },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      })

      if (!_permission) {
        return null
      }

      const role = Permission.create({
        id: _permission.id,
        name: _permission.name,
        description: _permission.description,
        roles: _permission.roles.map((role) => role.role),
      })

      return Result.ok<Permission>(role.getValue())
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar encontrar el permiso ${id} en la db`,
      )

      return null
    }
  }

  async save(permission: Permission): Promise<void> {
    const events = permission.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof PermissionCreatedEvent) {
          const { data } = event

          return this.createPermission({
            id: data.id,
            name: data.name,
            description: data.description,
          })
        }
      }),
    )
  }

  private async createPermission({
    id,
    name,
    description,
  }: Omit<PermissionCreatedEvent['data'], 'roles'>) {
    try {
      await this.prisma.permission.create({
        data: {
          id,
          name,
          description,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear el permiso ${name} en la db`,
      )
    }
  }
}
