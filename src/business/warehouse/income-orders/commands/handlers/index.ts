import { CancelIncomeOrderHandler } from './cancel-income-order.handler'
import { PlaceIncomeOrderHandler } from './place-income-order.handler'

export const CommandHandlers = [
  PlaceIncomeOrderHandler,
  CancelIncomeOrderHandler,
]
