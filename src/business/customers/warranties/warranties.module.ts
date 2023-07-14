import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { WarrantiesController } from './warranties.controller'
import { WarrantyOrderRepository } from './repository/warranty-order.repository'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { CommandHandlers } from './commands/handlers'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [WarrantiesController],
  providers: [WarrantyOrderRepository, ...CommandHandlers],
})
export class WarrantiesModule {}
