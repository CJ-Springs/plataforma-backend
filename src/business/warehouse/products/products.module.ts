import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { ProductsController } from './products.controller'
import { CommandHandlers } from './commands/handlers'
import { ProductRepository } from './repository/product.repository'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [ProductsController],
  providers: [ProductRepository, ...CommandHandlers],
})
export class ProductsModule {}
