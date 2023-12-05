import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { AddProductDto, UpdateProductDto } from './dtos'
import { AddProductCommand } from './commands/impl/add-product.command'
import { UpdateProductCommand } from './commands/impl/update-product.command'
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

  @RequiredPermissions('backoffice::actualizar-producto')
  @UseGuards(PermissionGuard)
  @Patch(':productCode')
  async updateProduct(
    @Param('productCode') productCode: string,
    @Body() data: UpdateProductDto,
  ) {
    return await this.commandBus.execute(
      new UpdateProductCommand({ ...data, code: productCode }),
    )
  }
}
