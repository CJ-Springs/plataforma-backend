import { EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { UserDeletedEvent } from '@/users/events/impl/user-deleted.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { NotificationsService } from '@/notifications/notifications.service'

@EventsHandler(UserDeletedEvent)
export class UserDeletedHandler implements IEventHandler<UserDeletedEvent> {
  constructor(
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handle(event: UserDeletedEvent) {
    this.logger.log(
      'Ejecutando el UserDeleted event handler',
      'En notifications',
    )

    const { data } = event

    this.notificationsService.removeSubscriber(data.id)
  }
}
