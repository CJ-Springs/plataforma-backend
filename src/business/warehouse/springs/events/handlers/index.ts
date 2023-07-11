import { StockAdjustedHandler } from './stock-adjusted.handler'
import { IncomeOrderConfirmedHandler } from './income-order-confirmed.handler'
import { StockIncrementedHandler } from './stock-incremented.handler'

export const EventHandlers = [
  StockAdjustedHandler,
  IncomeOrderConfirmedHandler,
  StockIncrementedHandler,
]
