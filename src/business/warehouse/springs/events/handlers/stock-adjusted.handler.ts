import { MovementType } from '@prisma/client'
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { StockAdjustedEvent } from '../impl/stock-adjusted.event'
import { RegisterMovementCommand } from '../../commands/impl/register-movement.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { MovementReason } from '@/.shared/types'

@EventsHandler(StockAdjustedEvent)
export class StockAdjustedHandler implements IEventHandler<StockAdjustedEvent> {
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  handle(event: StockAdjustedEvent) {
    this.logger.log('Springs', 'Ejecutando el StockAdjusted event handler', {
      logType: 'event-handler',
    })
    const { data } = event
    const { prevStock, updatedStock, ...info } = data

    const type =
      prevStock > updatedStock ? MovementType.EGRESO : MovementType.INGRESO

    this.commandBus.execute(
      new RegisterMovementCommand({
        ...info,
        updatedStock,
        reason: MovementReason.STOCK_ADJUSTMENT,
        type,
      }),
    )
  }
}
