import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { BillingService } from '../../billing.service'
import { CancelPaymentCommand } from '../../commands/impl/cancel-payment.command'
import { DepositCanceledEvent } from '@/business/customers/deposits/events/impl/deposit-canceled.event'
import { ReduceBalanceCommand } from '@/business/customers/commands/impl/reduce-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { PrismaService } from '@/.shared/infra/prisma.service'

@EventsHandler(DepositCanceledEvent)
export class DepositCanceledHandler
  implements IEventHandler<DepositCanceledEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DepositCanceledEvent) {
    this.logger.log('Billing', 'Ejecutando el DepositCanceled event handler', {
      logType: 'event-handler',
    })

    const { data: canceledDeposit } = event

    const payments = await this.prisma.payment.findMany({
      where: { depositId: canceledDeposit.depositId },
      select: { id: true },
    })

    for await (const payment of payments) {
      await this.commandBus.execute(
        new CancelPaymentCommand({
          paymentId: payment.id,
          canceledBy: canceledDeposit.canceledBy,
        }),
      )
    }

    if (canceledDeposit.remaining > 0) {
      const { balance: customerBalance } =
        await this.prisma.customer.findUnique({
          where: { code: canceledDeposit.customerCode },
          select: { balance: true },
        })

      if (customerBalance >= canceledDeposit.remaining) {
        return await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: canceledDeposit.customerCode,
            reduction: canceledDeposit.remaining,
          }),
        )
      }

      let depositRemaining = canceledDeposit.remaining

      if (customerBalance > 0) {
        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: canceledDeposit.customerCode,
            reduction: customerBalance,
          }),
        )

        depositRemaining -= customerBalance
      }

      const { data } =
        await this.billingService.onPaymentOrDepositWithRemainingCanceled(
          canceledDeposit.customerCode,
          depositRemaining,
          canceledDeposit.canceledBy,
        )

      if (data.remaining) {
        await this.commandBus.execute(
          new ReduceBalanceCommand({
            code: canceledDeposit.customerCode,
            reduction: data.remaining,
          }),
        )
      }
    }
  }
}
