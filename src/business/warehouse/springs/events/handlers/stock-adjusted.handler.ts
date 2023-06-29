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
    this.logger.log('Ejecutando el StockAdjusted event handler', 'En springs')
    const { data } = event

    const type =
      data.prevStock > data.updatedStock
        ? MovementType.EGRESO
        : MovementType.INGRESO

    this.commandBus.execute(
      new RegisterMovementCommand({
        ...data,
        reason: MovementReason.STOCK_ADJUSTMENT,
        type,
      }),
    )
  }
}
