import { InvoiceStatus } from '@prisma/client'
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
      data: { orderId, status, payment: canceledPayment },
    } = event

    const { customer } = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      select: { customer: { select: { code: true } } },
    })

    if (status === InvoiceStatus.DEUDA) {
      await this.commandBus.execute(
        new ReduceBalanceCommand({
          code: customer.code,
          reduction: canceledPayment.netAmount,
        }),
      )
    }

    if (canceledPayment.remaining > 0) {
      const { balance: customerBalance } =
        await this.prisma.customer.findUnique({
          where: { code: customer.code },
          select: { balance: true },
        })

      let canceledPaymentRemaining = canceledPayment.remaining

      if (customerBalance > 0) {
        const reduceFromBalance =
          canceledPaymentRemaining > customerBalance
            ? customerBalance
            : canceledPaymentRemaining

        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: customer.code,
            reduction: reduceFromBalance,
          }),
        )

        canceledPaymentRemaining -= reduceFromBalance
        if (canceledPaymentRemaining === 0) return
      }

      const { data } =
        await this.billingService.onPaymentOrDepositWithRemainingCanceled(
          customer.code,
          canceledPaymentRemaining,
          canceledPayment.canceledBy,
        )

      if (data.remaining) {
        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: customer.code,
            reduction: data.remaining,
          }),
        )
      }
    }
  }
}
