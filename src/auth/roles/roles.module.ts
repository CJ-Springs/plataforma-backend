import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { RolesController } from './roles.controller'
import { CommandHandlers } from './commands/handlers'
import { RoleRepository } from './repository/role.repository'
import { RoleSagas } from './sagas/role.sagas'
import { RolesService } from './roles.service';

@Module({
  imports: [CqrsModule],
  controllers: [RolesController],
  providers: [RoleRepository, RoleSagas, ...CommandHandlers, RolesService],
})
export class RolesModule {}
