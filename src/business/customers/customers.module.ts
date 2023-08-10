import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CustomersController } from './customers.controller'
import { CustomerRepository } from './repository/customer.repository'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { WarrantiesModule } from './warranties/warranties.module'
import { CreditNotesModule } from './credit-notes/credit-notes.module'

@Module({
  imports: [CqrsModule, RolesModule, WarrantiesModule, CreditNotesModule],
  controllers: [CustomersController],
  providers: [CustomerRepository, ...CommandHandlers, ...EventHandlers],
})
export class CustomersModule {}
