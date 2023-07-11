import { PlaceIncomeOrderHandler } from './place-income-order.handler'
import { CancelIncomeOrderHandler } from './cancel-income-order.handler'
import { ConfirmIncomeOrderHandler } from './confirm-income-order.handler'

export const CommandHandlers = [
  PlaceIncomeOrderHandler,
  CancelIncomeOrderHandler,
  ConfirmIncomeOrderHandler,
]
