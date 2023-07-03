import { Module } from '@nestjs/common'

import { PricingController } from './pricing.controller'
import { PricingService } from './pricing.service'
import { PricingRepository } from './repository/pricing.repository'
import { CommandHandlers } from './commands/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [RolesModule, CqrsModule],
  controllers: [PricingController],
  providers: [PricingRepository, PricingService, ...CommandHandlers],
})
export class PricingModule {}
