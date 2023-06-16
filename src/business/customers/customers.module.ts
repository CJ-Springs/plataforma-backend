import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CustomersController } from './customers.controller'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [CustomersController],
})
export class CustomersModule {}
