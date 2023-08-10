import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs'

import { CreditNoteMadeEvent } from '@/business/customers/credit-notes/events/impl/credit-note-made.event'
import { IncrementStockCommand } from '../../commands/impl/increment-stock.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { MovementReason } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

type Spring = {
  code: string
  returned: number
}

@EventsHandler(CreditNoteMadeEvent)
export class CreditNoteMadeHandler
  implements IEventHandler<CreditNoteMadeEvent>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: CreditNoteMadeEvent) {
    this.logger.log('Springs', 'Ejecutando el CreditNoteMade event handler', {
      logType: 'event-handler',
    })

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

      springs.push({ code: product.spring.code, returned: item.returned })
    }

    const springsMap = springs.reduce((acc, { code, returned }) => {
      if (acc.has(code)) {
        const prevReturned = acc.get(code)
        return acc.set(code, prevReturned + returned)
      }

      return acc.set(code, returned)
    }, new Map<string, number>())

    for (const [code, returned] of springsMap)
      this.commandBus.execute(
        new IncrementStockCommand({
          code,
          entered: returned,
          reason: MovementReason.CREDIT_NOTE,
        }),
      )
  }
}
