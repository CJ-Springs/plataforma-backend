import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAmountReducedEvent } from '@/business/billing/events/impl/payment-amount-reduced.event'
import { ReduceBalanceCommand } from '../../commands/impl/reduce-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(PaymentAmountReducedEvent)
export class PaymentAmountReducedHandler
  implements IEventHandler<PaymentAmountReducedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: PaymentAmountReducedEvent) {
    this.logger.log(
      'Customers',
      'Ejecutando el PaymentAmountReduced event handler',
      { logType: 'event-handler' },
    )

    const { data } = event

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      select: { customer: { select: { code: true } } },
    })

    return this.commandBus.execute(
      new ReduceBalanceCommand({
        code: order.customer.code,
        reduction: data.payment.reduction,
      }),
    )
  }
}
