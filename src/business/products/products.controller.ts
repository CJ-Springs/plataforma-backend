import { BadRequestException, Controller, Get } from '@nestjs/common'
import { Product } from './aggregate/product.aggregate'
import { ProductType } from '@prisma/client'
import { AllowedCurrency } from '@/.shared/helpers'

@Controller('productos')
export class ProductsController {
  @Get()
  getProduct() {
    const productOrError = Product.create({
      code: '1203N',
      type: ProductType.COMPETICION,
      brand: 'Fiat',
      model: 'Fitito',
      isGnc: false,
      amountOfSales: 0,
      price: {
        price: 6100,
        currency: AllowedCurrency.USD,
      },
      spring: {
        code: '1203N',
        isAssociated: false,
        minQuantity: 10,
        stock: {
          quantityOnHand: 7,
        },
      },
    })
    if (productOrError.isFailure) {
      throw new BadRequestException(productOrError.getErrorValue())
    }
    const product = productOrError.getValue()
    product.raisePrice(500)

    return product.toDTO()
  }
}
