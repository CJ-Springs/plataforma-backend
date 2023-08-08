import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAppendedEvent } from '@/business/billing/events/impl/payment-appended.event'
import { IncreaseBalanceCommand } from '../../commands/impl/increase-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(PaymentAppendedEvent)
export class PaymentAppendedHandler
  implements IEventHandler<PaymentAppendedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: PaymentAppendedEvent) {
    this.logger.log(
      'Customers',
      'Ejecutando el PaymentAppended event handler',
      { logType: 'event-handler' },
    )

    const { data } = event

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      select: { customer: { select: { code: true } } },
    })

    return this.commandBus.execute(
      new IncreaseBalanceCommand({
        code: order.customer.code,
        increment: data.payment.amount,
      }),
    )
  }
}
