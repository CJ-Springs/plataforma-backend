import { EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { RecoveryCodeGeneratedEvent } from '@/auth/authentication/events/impl/recovery-code-generated.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { NotificationsService } from '@/notifications/notifications.service'
import { NovuEvent } from '@/notifications/novu-events.types'

@EventsHandler(RecoveryCodeGeneratedEvent)
export class RecoveryCodeGeneratedHandler
  implements IEventHandler<RecoveryCodeGeneratedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handle(event: RecoveryCodeGeneratedEvent) {
    this.logger.log(
      'Ejecutando el RecoveryCodeGenerated event handler',
      'En notifications',
    )
    const { data } = event

    this.notificationsService.trigger(NovuEvent.RECOVERY_PASSWORD_CODE, {
      to: {
        subscriberId: data.userId,
        email: data.email,
      },
      payload: {
        code: data.code,
      },
    })
  }
}
