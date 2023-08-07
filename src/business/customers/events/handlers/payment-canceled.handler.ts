import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentCanceledEvent } from '@/business/billing/events/impl/payment-canceled.event'
import { ReduceBalanceCommand } from '../../commands/impl/reduce-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(PaymentCanceledEvent)
export class PaymentCanceledHandler
  implements IEventHandler<PaymentCanceledEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: PaymentCanceledEvent) {
    this.logger.log(
      'Ejecutando el PaymentCanceled event handler',
      'En customers',
    )

    const { data } = event

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      select: { customer: { select: { code: true } } },
    })

    return this.commandBus.execute(
      new ReduceBalanceCommand({
        code: order.customer.code,
        reduction: data.payment.amount,
      }),
    )
  }
}
