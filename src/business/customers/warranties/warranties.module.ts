import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { WarrantiesController } from './warranties.controller'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { CommandHandlers } from './commands/handlers'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [WarrantiesController],
  providers: [...CommandHandlers],
})
export class WarrantiesModule {}
