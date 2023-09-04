import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { BillingService } from '../../billing.service'
import { DepositCanceledEvent } from '@/business/customers/deposits/events/impl/deposit-canceled.event'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { CancelPaymentCommand } from '../../commands/impl/cancel-payment.command'

@EventsHandler(DepositCanceledEvent)
export class DepositCanceledHandler
  implements IEventHandler<DepositCanceledEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DepositCanceledEvent) {
    this.logger.log('Billing', 'Ejecutando el DepositCanceled event handler', {
      logType: 'event-handler',
    })

    const { data } = event

    const payments = await this.prisma.payment.findMany({
      where: { depositId: data.depositId },
      select: { id: true },
    })

    for await (const payment of payments) {
      await this.commandBus.execute(
        new CancelPaymentCommand({
          paymentId: payment.id,
          canceledBy: data.canceledBy,
        }),
      )
    }

    if (data.remaining > 0) {
    }
  }
}
