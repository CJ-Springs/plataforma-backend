import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { IRepository } from '@/.shared/types'
import { UniqueEntityID } from '@/.shared/domain'
import { Result } from '@/.shared/helpers'
import { Role, RoleProps } from '../aggregate/role.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class RoleRepository implements IRepository<Role, RoleProps> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Role>> {
    try {
      const _role = await this.prisma.role.findUnique({
        where: { id },
        include: { permissions: true },
      })

      if (!_role) {
        return Result.fail<Role>(`Rol con id ${id} no encontrado`)
      }

      const role = new Role({
        id: new UniqueEntityID(_role.id),
        role: _role.role,
        permissions: _role.permissions.map((permission) => permission.id),
      })

      return Result.ok<Role>(role)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar encontrar el rol ${id} en la db`,
      )

      return Result.fail<Role>('Rol no encontrado')
    }
  }

  async findOneByUniqueInput(
    where: Prisma.RoleWhereUniqueInput,
  ): Promise<Result<Role>> {
    try {
      const _role = await this.prisma.role.findUnique({
        where,
        include: { permissions: true },
      })

      if (!_role) {
        return Result.fail<Role>('Rol no encontrado')
      }

      const role = new Role({
        id: new UniqueEntityID(_role.id),
        role: _role.role,
        permissions: _role.permissions.map((permission) => permission.id),
      })

      return Result.ok<Role>(role)
    } catch (error) {
      this.logger.error(error, `Error al intentar encontrar el rol en la db`)
      return Result.fail<Role>('Rol no encontrado')
    }
  }

  async save(data: Partial<RoleProps>): Promise<Result<Role>> {
    try {
      let permissions = []

      if (data.permissions) {
        permissions = data.permissions.map((permission) => ({ id: permission }))
      }

      const _role = await this.prisma.role.upsert({
        where: {
          id: data.id.toString(),
        },
        create: {
          role: data.role,
          permissions: {
            connect: permissions,
          },
        },
        update: {
          permissions: {
            connect: permissions,
          },
        },
        include: {
          permissions: true,
        },
      })

      const role = new Role({
        id: new UniqueEntityID(_role.id),
        role: _role.role,
        permissions: _role.permissions.map((permission) => permission.id),
      })

      return Result.ok<Role>(role)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear o actualizar el rol en la db`,
      )

      return Result.fail<Role>('Error al tratar de crear o actualizar un rol')
    }
  }
}
