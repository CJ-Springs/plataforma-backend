import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import {
  AddProductDto,
  IncreaseBulkProductsPriceDto,
  IncreaseProductPriceDto,
} from './dtos'
import { ProductsService } from './products.service'
import { AddProductCommand } from './commands/impl/add-product.command'
import { IncreaseProductPriceCommand } from './commands/impl/increase-product-price.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('productos')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly productsService: ProductsService,
  ) {}

  @RequiredPermissions('backoffice::añadir-producto')
  @UseGuards(PermissionGuard)
  @Post()
  async addProduct(@Body() newProduct: AddProductDto) {
    return await this.commandBus.execute(new AddProductCommand(newProduct))
  }

  @RequiredPermissions('backoffice::aumentar-precios')
  @UseGuards(PermissionGuard)
  @Patch('aumentar-precios')
  async increaseBulkProductsPrice(@Body() data: IncreaseBulkProductsPriceDto) {
    return await this.productsService.increaseBulkProductsPrice(data)
  }

  @RequiredPermissions('backoffice::aumentar-precios')
  @UseGuards(PermissionGuard)
  @Patch('aumentar-precios/:code')
  async increaseSingleProductPrice(
    @Param('code') code: string,
    @Body() data: IncreaseProductPriceDto,
  ) {
    return await this.commandBus.execute(
      new IncreaseProductPriceCommand({
        code,
        ...data,
      }),
    )
  }
}
