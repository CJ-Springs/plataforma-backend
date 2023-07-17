import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { SalesController } from './sales.controller'
import { CommandHandlers } from './commands/handlers'
import { PricingModule } from './pricing/pricing.module'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, PricingModule, RolesModule],
  controllers: [SalesController],
  providers: [...CommandHandlers],
})
export class SalesModule {}
