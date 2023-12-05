import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { InvoiceDuedEvent } from '@/business/billing/events/impl/invoice-dued.event'
import { ReduceBalanceCommand } from '../../commands/impl/reduce-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(InvoiceDuedEvent)
export class InvoiceDuedHandler implements IEventHandler<InvoiceDuedEvent> {
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: InvoiceDuedEvent) {
    this.logger.log('Customers', 'Ejecutando el InvoiceDued event handler', {
      logType: 'event-handler',
    })

    const { data: invoice } = event

    const order = await this.prisma.saleOrder.findFirst({
      where: { invoice: { id: invoice.id } },
      select: { customer: { select: { code: true } } },
    })

    return this.commandBus.execute(
      new ReduceBalanceCommand({
        code: order.customer.code,
        reduction: invoice.leftToPay,
      }),
    )
  }
}
