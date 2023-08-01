import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAppendedEvent } from '../impl/payment-appended.event'
import { PayInvoiceCommand } from '../../commands/impl/pay-invoice.command'
import { BillingService } from '../../billing.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(PaymentAppendedEvent)
export class PaymentAppendedHandler
  implements IEventHandler<PaymentAppendedEvent>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
  ) {}

  async handle(event: PaymentAppendedEvent) {
    this.logger.log('Ejecutando el PaymentAppended event handler', 'En billing')

    const {
      data: { invoiceId, deposited, total, remaining, ...data },
    } = event

    if (deposited === total) {
      await this.commandBus.execute(new PayInvoiceCommand({ invoiceId }))
    }

    if (remaining) {
      const order = await this.prisma.saleOrder.findUnique({
        where: { id: data.orderId },
        select: { customerCode: true },
      })

      await this.billingService.usePaymentRemaining(
        order.customerCode,
        remaining,
        {
          createdBy: data.payment.createdBy,
          paymentMethod: data.payment.paymentMethod,
          metadata: data.payment.metadata,
        },
      )
    }
  }
}
