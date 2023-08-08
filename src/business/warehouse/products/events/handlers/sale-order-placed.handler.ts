import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { SaleOrderPlacedEvent } from '@/business/sales/events/impl/sale-order-placed.event'
import { IncrementAmountOfSalesCommand } from './../../commands/impl/increment-amount-of-sales.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(SaleOrderPlacedEvent)
export class SaleOrderPlacedHandler
  implements IEventHandler<SaleOrderPlacedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: SaleOrderPlacedEvent) {
    this.logger.log('Products', 'Ejecutando el SaleOrderPlaced event handler', {
      logType: 'event-handler',
    })

    const { data } = event

    for (const item of data.items) {
      this.commandBus.execute(
        new IncrementAmountOfSalesCommand({
          code: item.productCode,
          increment: item.requested,
        }),
      )
    }
  }
}
