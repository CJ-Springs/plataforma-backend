import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { AssignPermissionCommand } from '../../commands/impl/assign-permission'
import { PermissionCreatedEvent } from '@/auth/authorization/permissions/events/impl/permission-created.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(PermissionCreatedEvent)
export class PermissionCreatedHandler
  implements IEventHandler<PermissionCreatedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: PermissionCreatedEvent) {
    this.logger.log('Ejecutando PermissionCreated event handler', 'En roles')

    const { data } = event

    if (data.roles.length) {
      const { roles } = data
      for await (const role of roles) {
        await this.commandBus.execute(
          new AssignPermissionCommand({
            permission: data.name,
            role,
          }),
        )
      }
    }
  }
}
