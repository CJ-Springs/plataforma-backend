import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { BillingService } from '../../billing.service'
import { PaymentCanceledEvent } from '@/business/billing/events/impl/payment-canceled.event'
import { ReduceBalanceCommand } from '@/business/customers/commands/impl/reduce-balance.command'
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
    private readonly billingService: BillingService,
  ) {}

  async handle(event: PaymentCanceledEvent) {
    this.logger.log('Billing', 'Ejecutando el PaymentCanceled event handler', {
      logType: 'event-handler',
    })

    const {
      data: { orderId, payment: canceledPayment },
    } = event

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      select: { customer: { select: { code: true, balance: true } } },
    })

    await this.commandBus.execute(
      new ReduceBalanceCommand({
        code: order.customer.code,
        reduction: canceledPayment.amount - canceledPayment.remaining,
      }),
    )

    if (canceledPayment.remaining > 0) {
      const customerBalance = order.customer.balance

      if (customerBalance >= canceledPayment.remaining) {
        return await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: order.customer.code,
            reduction: canceledPayment.remaining,
          }),
        )
      }

      let paymentRemaining = canceledPayment.remaining

      if (customerBalance > 0) {
        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: order.customer.code,
            reduction: customerBalance,
          }),
        )

        paymentRemaining -= customerBalance
      }

      const { data } =
        await this.billingService.onPaymentOrDepositWithRemainingCanceled(
          order.customer.code,
          paymentRemaining,
          canceledPayment.canceledBy,
        )

      if (data.remaining) {
        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: order.customer.code,
            reduction: data.remaining,
          }),
        )
      }
    }
  }
}
