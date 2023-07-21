import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { InvoiceRepository } from './repository/invoice.repository'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'
import { BillingService } from './billing.service'

@Module({
  imports: [CqrsModule],
  providers: [
    BillingService,
    InvoiceRepository,
    ...CommandHandlers,
    ...EventHandlers,
  ],
})
export class BillingModule {}
