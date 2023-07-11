import { MovementType } from '@prisma/client'
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { StockIncrementedEvent } from '../impl/stock-incremented.event'
import { RegisterMovementCommand } from '../../commands/impl/register-movement.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(StockIncrementedEvent)
export class StockIncrementedHandler
  implements IEventHandler<StockIncrementedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  handle(event: StockIncrementedEvent) {
    this.logger.log(
      'Ejecutando el StockIncremented event handler',
      'En springs',
    )

    const { data } = event

    this.commandBus.execute(
      new RegisterMovementCommand({
        ...data,
        type: MovementType.INGRESO,
      }),
    )
  }
}
