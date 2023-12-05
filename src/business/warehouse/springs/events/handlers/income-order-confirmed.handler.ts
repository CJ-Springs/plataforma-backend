import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { IncomeOrderConfirmedEvent } from '../../../income-orders/events/impl/income-order-confirmed.event'
import { IncrementStockCommand } from '../../commands/impl/increment-stock.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { MovementReason } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

type Spring = {
  code: string
  entered: number
}

@EventsHandler(IncomeOrderConfirmedEvent)
export class IncomeOrderConfirmedHandler
  implements IEventHandler<IncomeOrderConfirmedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: IncomeOrderConfirmedEvent) {
    this.logger.log(
      'Springs',
      'Ejecutando el IncomeOrderConfirmed event handler',
      { logType: 'event-handler' },
    )

    const { data } = event
    const springs: Spring[] = []

    for await (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { code: item.productCode },
        select: {
          spring: {
            select: {
              code: true,
            },
          },
        },
      })

      springs.push({ code: product.spring.code, entered: item.entered })
    }

    const springsMap = springs.reduce((acc, { code, entered }) => {
      if (acc.has(code)) {
        const prevEntered = acc.get(code)
        return acc.set(code, prevEntered + entered)
      }

      return acc.set(code, entered)
    }, new Map<string, number>())

    for await (const [code, entered] of springsMap)
      await this.commandBus.execute(
        new IncrementStockCommand({
          code,
          entered,
          reason: MovementReason.INCOME_ORDER,
        }),
      )
  }
}
