import { EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { PaymentAddedEvent } from '../impl/payment-added.event'
import { BillingService } from '../../billing.service'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(PaymentAddedEvent)
export class PaymentAddedHandler implements IEventHandler<PaymentAddedEvent> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly billingService: BillingService,
  ) {}

  async handle(event: PaymentAddedEvent) {
    this.logger.log('Billing', 'Ejecutando el PaymentAdded event handler', {
      logType: 'event-handler',
    })

    const {
      data: { remaining, ...data },
    } = event

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
