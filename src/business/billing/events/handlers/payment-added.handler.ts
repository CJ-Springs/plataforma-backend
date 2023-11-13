import { InvoiceStatus, PaymentMethod } from '@prisma/client'
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
      data: { orderId, payment, prevStatus },
    } = event

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: orderId },
      select: { customerCode: true },
    })

    if (prevStatus === InvoiceStatus.DEUDA) {
      await this.commandBus.execute(
        new IncreaseBalanceCommand({
          code: order.customerCode,
          increment: payment.netAmount,
        }),
      )
    }

    if (payment.remaining > 0) {
      const { data } = await this.billingService.payBulkInvoices(
        order.customerCode,
        payment.remaining,
        {
          paymentMethod: PaymentMethod.SALDO_A_FAVOR,
          createdBy: payment.createdBy,
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
