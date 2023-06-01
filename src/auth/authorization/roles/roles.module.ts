import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { RolesController } from './roles.controller'
import { CommandHandlers } from './commands/handlers'
import { RoleRepository } from './repository/role.repository'
import { PrismaModule } from '@/.shared/infra/prisma.module'

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [RolesController],
  providers: [RoleRepository, ...CommandHandlers],
})
export class RolesModule {}
