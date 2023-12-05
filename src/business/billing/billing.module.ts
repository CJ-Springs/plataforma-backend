import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { InvoiceRepository } from './repository/invoice.repository'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'
import { BillingService } from './billing.service'
import { BillingController } from './billing.controller'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { NotificationsModule } from '@/notifications/notifications.module'

@Module({
  imports: [CqrsModule, RolesModule, NotificationsModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    InvoiceRepository,
    ...CommandHandlers,
    ...EventHandlers,
  ],
})
export class BillingModule {}
