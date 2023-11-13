import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { BillingService } from '../../billing.service'
import { DepositMadeEvent } from '@/business/customers/deposits/events/impl/deposit-made.event'
import { AddRemainingToDepositCommand } from '@/business/customers/deposits/commands/impl/add-remaining-to-deposit-remaining.command'
import { IncreaseBalanceCommand } from '@/business/customers/commands/impl/increase-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(DepositMadeEvent)
export class DepositMadeHandler implements IEventHandler<DepositMadeEvent> {
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
  ) {}

  async handle(event: DepositMadeEvent) {
    this.logger.log('Billing', 'Ejecutando el DepositMade event handler', {
      logType: 'event-handler',
    })

    const { data: deposit } = event

    const { data } = await this.billingService.payBulkInvoices(
      deposit.customerCode,
      deposit.amount,
      {
        createdBy: deposit.createdBy,
        paymentMethod: deposit.paymentMethod,
        depositId: deposit.id,
        metadata: deposit.metadata,
      },
    )

    if (data.remaining) {
      await this.commandBus.execute(
        new IncreaseBalanceCommand({
          code: deposit.customerCode,
          increment: data.remaining,
        }),
      )

      await this.commandBus.execute(
        new AddRemainingToDepositCommand({
          depositId: deposit.id,
          addition: data.remaining,
        }),
      )
    }
  }
}
