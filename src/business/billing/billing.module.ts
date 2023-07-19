import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { InvoiceRepository } from './repository/invoice.repository'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'

@Module({
  imports: [CqrsModule],
  providers: [InvoiceRepository, ...CommandHandlers, ...EventHandlers],
})
export class BillingModule {}
