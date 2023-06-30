import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { SpringsController } from './springs.controller'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [SpringsController],
  providers: [...CommandHandlers, ...EventHandlers],
})
export class SpringsModule {}
