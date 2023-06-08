import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PermissionCreatedEvent } from '@/auth/authorization/permissions/events/impl/permission-created.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { AssignPermissionCommand } from '../../commands/impl/assign-permission'

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

      for await (let role of roles) {
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
