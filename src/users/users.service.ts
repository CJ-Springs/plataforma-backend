import { LoggerService } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  private async findUserOrThrow(id: string) {
    return await this.prisma.user
      .findUniqueOrThrow({ where: { id } })
      .catch(() => {
        throw new NotFoundException(`Usuario con id ${id} no encontrado`)
      })
  }

  async deleteUser(id: string) {
    const existingUser = await this.findUserOrThrow(id)

    if (existingUser.deleted) {
      throw new BadRequestException(
        `El usuario con id ${id} ya ha sido eliminado`,
      )
    }

    try {
      await this.prisma.user.delete({ where: { id } })

      return {
        success: true,
        statusCode: 200,
        message: 'Usuario eliminado correctamente',
      }
    } catch (error) {
      this.logger.error(error, 'Error al intentar eliminar un usuario de la db')
      // TODO Unexpected error
    }
  }
}
