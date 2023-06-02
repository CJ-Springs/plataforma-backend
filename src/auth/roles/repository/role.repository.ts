import {
  ConflictException,
  Injectable,
  MethodNotAllowedException,
} from '@nestjs/common'

import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { IFindByUniqueInput, IRepository } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
import { Result } from '@/.shared/helpers'
import { Role, RoleProps } from '../aggregate/role.model'
import { Prisma } from '@prisma/client'
import { Permission } from '../permissions/aggregate/permission.model'

@Injectable()
export class RoleRepository
  implements IRepository<Role, RoleProps>, IFindByUniqueInput<Role>
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
              id: true,
              name: true,
              description: true,
            },
          },
        },
      })

      if (!_role) {
        return null
      }

      const role = new Role({
        id: new UniqueEntityID(_role.id),
        role: _role.role,
        permissions: _role.permissions.map(
          (permission) =>
            new Permission(
              new UniqueEntityID(permission.id),
              permission.name,
              permission.description,
            ),
        ),
      })

      return Result.ok<Role>(role)
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
        include: { permissions: true },
      })

      if (!_role) {
        return null
      }

      const role = new Role({
        id: new UniqueEntityID(_role.id),
        role: _role.role,
        permissions: _role.permissions.map(
          (permission) =>
            new Permission(
              new UniqueEntityID(permission.id),
              permission.name,
              permission.description,
            ),
        ),
      })

      return Result.ok<Role>(role)
    } catch (error) {
      this.logger.error(error, `Error al intentar encontrar el rol en la db`)

      return null
    }
  }

  async add(data: RoleProps): Promise<void> {
    try {
      const roleId = data.id.toString()

      const permissions = data.permissions.map((permission) => ({
        id: permission.id.toString(),
      }))

      await this.prisma.role.create({
        data: {
          id: roleId,
          role: data.role,
          permissions: {
            connect: permissions,
          },
        },
      })
    } catch (error) {
      this.logger.error(error, `Error al intentar crear  el rol en la db`)
    }
  }

  async update(data: Partial<RoleProps>): Promise<void> {
    try {
      const permissions = data.permissions.map((permission) => ({
        id: permission.id.toString(),
      }))

      await this.prisma.role.update({
        where: { id: data.id.toString() },
        data: {
          role: data.role,
          permissions: {
            connect: permissions,
          },
        },
      })
    } catch (error) {
      this.logger.error(error, `Error al intentar actualizar el rol en la db`)
    }
  }
}
