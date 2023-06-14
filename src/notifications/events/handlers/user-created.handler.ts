import { EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { UserCreatedEvent } from '@/users/events/impl/user-created.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { NotificationsService } from '@/notifications/notifications.service'

@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handle(event: UserCreatedEvent) {
    this.logger.log(
      'Ejecutando el UserCreated event handler',
      'En notifications',
    )

    const {
      data: { id, profile, email },
    } = event

    this.notificationsService.addSubscriber(id, {
      email,
      phone: profile.phone,
      firstName: profile.firstname,
      lastName: profile.lastname,
    })
  }
}
