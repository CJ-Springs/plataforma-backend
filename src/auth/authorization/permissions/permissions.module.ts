import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { PermissionsController } from './permissions.controller'
import { CommandHandlers } from './commands/handlers'
import { PermissionRepository } from './repository/permission.repository'
import { RolesModule } from '../roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [PermissionsController],
  providers: [PermissionRepository, ...CommandHandlers],
})
export class PermissionsModule {}
