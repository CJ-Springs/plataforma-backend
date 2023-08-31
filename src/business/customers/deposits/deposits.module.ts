import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { DepositsController } from './deposits.controller'
import { DepositRepository } from './repository/deposit.repository'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { CommandHandlers } from './commands/handlers'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [DepositsController],
  providers: [DepositRepository, ...CommandHandlers],
})
export class DepositsModule {}
