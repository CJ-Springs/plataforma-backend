import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { NotificationsService } from './notifications.service'
import { EventHandlers } from './events/handlers'

@Module({
  exports: [NotificationsService],
  imports: [CqrsModule],
  providers: [NotificationsService, ...EventHandlers],
})
export class NotificationsModule {}
