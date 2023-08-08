import { AddProductHandler } from './add-product.handler'
import { IncrementAmountOfSalesHandler } from './increment-amount-of-sales.handler'
import { UpdateProductHandler } from './update-product.handler'

export const CommandHandlers = [
  AddProductHandler,
  UpdateProductHandler,
  IncrementAmountOfSalesHandler,
]
