import { AppRole, Prisma } from '@prisma/client'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'

import { LoggerService } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { UserDeletedEvent } from './events/impl/user-deleted.event'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly eventBus: EventBus,
  ) {}

  private async findUserOrThrow(id: string, include?: Prisma.UserInclude) {
    return await this.prisma.user
      .findUniqueOrThrow({ where: { id }, include })
      .catch(() => {
        throw new NotFoundException(`Usuario con id ${id} no encontrado`)
      })
  }

  async deleteUser(id: string) {
    this.logger.log('Users', 'Ejecutando el método deleteUser', {
      logType: 'service',
    })

    const existingUser = await this.findUserOrThrow(id, { roles: true })
    if (existingUser.deleted) {
      throw new BadRequestException(
        `El usuario con id ${id} ya ha sido eliminado`,
      )
    }
    if (existingUser.roles.some((role) => role.code === AppRole.SUPER_ADMIN)) {
      throw new BadRequestException(
        `No se puede eliminar a un usuario ${AppRole.SUPER_ADMIN}`,
      )
    }

    try {
      await this.prisma.user.delete({ where: { id } })

      this.eventBus.publish(new UserDeletedEvent({ id: existingUser.id }))

      return {
        success: true,
        statusCode: 200,
        message: `Usuario ${existingUser.email} eliminado`,
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar eliminar el usuario ${existingUser.email} de la db`,
      )
      throw new BadRequestException(
        `Error al intentar eliminar el usuario ${existingUser.email} de la db`,
      )
    }
  }
}
