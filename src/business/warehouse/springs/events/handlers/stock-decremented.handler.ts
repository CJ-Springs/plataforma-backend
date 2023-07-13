import { MovementType } from '@prisma/client'
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { StockDecrementedEvent } from '../impl/stock-decremented.event'
import { RegisterMovementCommand } from '../../commands/impl/register-movement.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(StockDecrementedEvent)
export class StockDecrementedHandler
  implements IEventHandler<StockDecrementedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  handle(event: StockDecrementedEvent) {
    this.logger.log(
      'Ejecutando el StockDecremented event handler',
      'En springs',
    )

    const { data } = event

    this.commandBus.execute(
      new RegisterMovementCommand({
        ...data,
        type: MovementType.EGRESO,
      }),
    )
  }
}
