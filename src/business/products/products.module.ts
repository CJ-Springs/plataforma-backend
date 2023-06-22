import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { ProductsController } from './products.controller'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [ProductsController],
})
export class ProductsModule {}
