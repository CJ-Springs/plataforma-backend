import { Injectable } from '@nestjs/common'

import { Permission } from '../aggregate/permission.aggregate'
import { PermissionCreatedEvent } from '../events/impl/permission-created.event'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { IRepository } from '@/.shared/types'
import { Result } from '@/.shared/helpers'

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

      return Permission.create({
        ..._permission,
        roles: _permission.roles.map((role) => role.role),
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar el permiso ${id} en la db`,
      )

      return null
    }
  }

  async save(permission: Permission): Promise<void> {
    const events = permission.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof PermissionCreatedEvent) {
          return this.createPermission(event.data)
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
