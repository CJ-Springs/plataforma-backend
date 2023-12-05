import { AddProductHandler } from './add-product.handler'
import { UpdateProductHandler } from './update-product.handler'
import { DecrementAmountOfSalesHandler } from './decrement-amount-of-sales.handler'
import { IncrementAmountOfSalesHandler } from './increment-amount-of-sales.handler'

export const CommandHandlers = [
  AddProductHandler,
  UpdateProductHandler,
  IncrementAmountOfSalesHandler,
  DecrementAmountOfSalesHandler,
]
