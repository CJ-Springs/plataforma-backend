import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAppendedEvent } from '../impl/payment-appended.event'
import { PayInvoiceCommand } from '../../commands/impl/pay-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(PaymentAppendedEvent)
export class PaymentAppendedHandler
  implements IEventHandler<PaymentAppendedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: PaymentAppendedEvent) {
    this.logger.log('Ejecutando el PaymentAppended event handler', 'En billing')

    const {
      data: { invoiceId, deposited, total },
    } = event

    if (deposited === total) {
      return this.commandBus.execute(new PayInvoiceCommand({ invoiceId }))
    }
  }
}
