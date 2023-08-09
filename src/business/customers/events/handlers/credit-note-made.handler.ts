import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { CreditNoteMadeEvent } from '../../credit-notes/events/impl/credit-note-made.event'
import { IncreaseBalanceCommand } from '../../commands/impl/increase-balance.command'
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
    this.logger.log('Customers', 'Ejecutando el CreditNoteMade event handler', {
      logType: 'event-handler',
    })

    const { data } = event

    const increment = data.items.reduce((acc, { price, returned }) => {
      return acc + price * returned
    }, 0)

    return this.commandBus.execute(
      new IncreaseBalanceCommand({
        code: data.customerCode,
        increment,
      }),
    )
  }
}
