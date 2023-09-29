import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { SaleOrderPlacedEvent } from '@/business/sales/events/impl/sale-order-placed.event'
import { DecrementStockCommand } from '../../commands/impl/decrement-stock.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { MovementReason } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

type Spring = {
  code: string
  requested: number
}

@EventsHandler(SaleOrderPlacedEvent)
export class SaleOrderPlacedHandler
  implements IEventHandler<SaleOrderPlacedEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: SaleOrderPlacedEvent) {
    this.logger.log('Springs', 'Ejecutando el SaleOrderPlaced event handler', {
      logType: 'event-handler',
    })

    const { data } = event
    const springs: Spring[] = []

    for await (const { productCode, requested } of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { code: productCode },
        select: {
          spring: {
            select: {
              code: true,
            },
          },
        },
      })

      springs.push({ code: product.spring.code, requested })
    }

    const springsMap = springs.reduce((acc, { code, requested }) => {
      if (acc.has(code)) {
        const prevRequested = acc.get(code)
        return acc.set(code, prevRequested + requested)
      }

      return acc.set(code, requested)
    }, new Map<string, number>())

    for await (const [code, requested] of springsMap)
      await this.commandBus.execute(
        new DecrementStockCommand({
          code,
          requested,
          reason: MovementReason.SALE_ORDER,
        }),
      )
  }
}
