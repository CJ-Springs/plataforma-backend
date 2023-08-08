import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { SaleOrderPlacedEvent } from '@/business/sales/events/impl/sale-order-placed.event'
import { GenerateInvoiceCommand } from '../../commands/impl/generate-invoice.command'
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
    this.logger.log('Billing', 'Ejecutando el SaleOrderPlaced event handler', {
      logType: 'event-handler',
    })

    const {
      data: { id, items, createdBy },
    } = event

    return this.commandBus.execute(
      new GenerateInvoiceCommand({
        orderId: id,
        createdBy,
        items: items.map((item) => ({
          productCode: item.productCode,
          salePrice: item.salePrice,
          quantity: item.requested,
        })),
      }),
    )
  }
}
