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
    // const productOrError = Product.create({
    //   code: '1203N',
    //   type: ProductType.COMPETICION,
    //   brand: 'Fiat',
    //   model: 'Fitito',
    //   isGnc: false,
    //   amountOfSales: 0,
    //   price: {
    //     price: 6100,
    //     currency: AllowedCurrency.USD,
    //   },
    //   spring: {
    //     code: '1203N',
    //     canAssociate: false,
    //     minQuantity: 10,
    //     stock: {
    //       quantityOnHand: 7,
    //     },
    //   },
    // })
    // if (productOrError.isFailure) {
    //   throw new BadRequestException(productOrError.getErrorValue())
    // }
    // const product = productOrError.getValue()
    // product.raisePrice(500)
    // return product.toDTO()
  }
}
