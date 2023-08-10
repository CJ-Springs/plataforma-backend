import { PaymentMethod } from '@prisma/client'
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { BillingService } from '../../billing.service'
import { CreditNoteMadeEvent } from '@/business/customers/credit-notes/events/impl/credit-note-made.event'
import { IncreaseBalanceCommand } from '@/business/customers/commands/impl/increase-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(CreditNoteMadeEvent)
export class CreditNoteMadeHandler
  implements IEventHandler<CreditNoteMadeEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
  ) {}

  async handle(event: CreditNoteMadeEvent) {
    this.logger.log('Billing', 'Ejecutando el CreditNoteMade event handler', {
      logType: 'event-handler',
    })

    const { data: creditNote } = event

    const creditNoteTotalAmount = creditNote.items.reduce(
      (acc, { price, returned }) => {
        return acc + price * returned
      },
      0,
    )

    const { data } = await this.billingService.payBulkInvoices(
      creditNote.customerCode,
      {
        createdBy: creditNote.createdBy,
        paymentMethod: PaymentMethod.SALDO_A_FAVOR,
        amount: creditNoteTotalAmount,
      },
    )

    if (data.remaining) {
      return await this.commandBus.execute(
        new IncreaseBalanceCommand({
          code: creditNote.customerCode,
          increment: data.remaining,
        }),
      )
    }
  }
}
