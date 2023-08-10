import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { CreditNoteMadeEvent } from '@/business/customers/credit-notes/events/impl/credit-note-made.event'
import { DecrementAmountOfSalesCommand } from '../../commands/impl/decrement-amount-of-sales.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(CreditNoteMadeEvent)
export class CreditNoteMadeHandler
  implements IEventHandler<CreditNoteMadeEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: CreditNoteMadeEvent) {
    this.logger.log('Products', 'Ejecutando el CreditNoteMade event handler', {
      logType: 'event-handler',
    })

    const { data } = event

    for await (const item of data.items) {
      await this.commandBus.execute(
        new DecrementAmountOfSalesCommand({
          code: item.productCode,
          reduction: item.returned,
        }),
      )
    }
  }
}
