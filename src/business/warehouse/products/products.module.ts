import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { ProductsController } from './products.controller'
import { ProductRepository } from './repository/product.repository'
import { CommandHandlers } from './commands/handlers'
import { EventHandlers } from './events/handlers'
import { RolesModule } from '@/auth/authorization/roles/roles.module'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [ProductsController],
  providers: [ProductRepository, ...CommandHandlers, ...EventHandlers],
})
export class ProductsModule {}
