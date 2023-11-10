import { PaymentMethod } from '@prisma/client'
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAddedEvent } from '../impl/payment-added.event'
import { BillingService } from '../../billing.service'
import { IncreaseBalanceCommand } from '@/business/customers/commands/impl/increase-balance.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'

@EventsHandler(PaymentAddedEvent)
export class PaymentAddedHandler implements IEventHandler<PaymentAddedEvent> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
  ) {}

  async handle(event: PaymentAddedEvent) {
    this.logger.log('Billing', 'Ejecutando el PaymentAdded event handler', {
      logType: 'event-handler',
    })

    const {
      data: { orderId, payment },
    } = event

    if (payment.paymentMethod === PaymentMethod.SALDO_A_FAVOR) return

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      select: { customerCode: true },
    })

    await this.commandBus.execute(
      new IncreaseBalanceCommand({
        code: order.customerCode,
        increment: payment.netAmount,
      }),
    )

    if (payment.remaining > 0) {
      // Creo que se deberían registrar como pagos de SALDO A FAVOR
      const { data } = await this.billingService.payBulkInvoices(
        order.customerCode,
        {
          ...payment,
          amount: payment.remaining,
        },
      )

      if (data.remaining) {
        await this.commandBus.execute(
          new IncreaseBalanceCommand({
            code: order.customerCode,
            increment: data.remaining,
          }),
        )
      }
    }
  }
}
