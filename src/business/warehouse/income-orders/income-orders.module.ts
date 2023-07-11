import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { IncomeOrdersController } from './income-orders.controller'
import { IncomeOrderRepository } from './repository/income-order.repository'
import { CommandHandlers } from './commands/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [RolesModule, CqrsModule],
  controllers: [IncomeOrdersController],
  providers: [IncomeOrderRepository, ...CommandHandlers],
})
export class IncomeOrdersModule {}
