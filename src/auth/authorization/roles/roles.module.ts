import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { RolesController } from './roles.controller'
import { CommandHandlers } from './commands/handlers'
import { RoleRepository } from './repository/role.repository'
import { RolesService } from './roles.service'
import { EventHandlers } from './events/handlers'

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [
    RoleRepository,
    RolesService,
    ...CommandHandlers,
    ...EventHandlers,
  ],
})
export class RolesModule {}
