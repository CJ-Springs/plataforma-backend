import { PrismaService } from '@/.shared/infra/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleById({ id }: { id: string }) {
    return await this.prisma.role
      .findFirstOrThrow({
        where: { id },
        include: { permissions: true },
      })
      .catch((_err) => {
        throw new NotFoundException(`Rol con id ${id} no encontrado`)
      })
  }
}
