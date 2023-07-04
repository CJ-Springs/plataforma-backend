import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { AddProductDto } from './dtos'
import { AddProductCommand } from './commands/impl/add-product.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('productos')
export class ProductsController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::añadir-producto')
  @UseGuards(PermissionGuard)
  @Post()
  async addProduct(@Body() newProduct: AddProductDto) {
    return await this.commandBus.execute(new AddProductCommand(newProduct))
  }
}
