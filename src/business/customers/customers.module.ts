import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CustomersController } from './customers.controller'
import { CustomerRepository } from './repository/customer.repository'
import { CommandHandlers } from './commands/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [CustomersController],
  providers: [CustomerRepository, ...CommandHandlers],
})
export class CustomersModule {}
