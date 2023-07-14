import { StockAdjustedHandler } from './stock-adjusted.handler'
import { IncomeOrderConfirmedHandler } from './income-order-confirmed.handler'
import { StockIncrementedHandler } from './stock-incremented.handler'
import { WarrantyOrderCreatedHandler } from './warranty-order-created.handler'
import { StockDecrementedHandler } from './stock-decremented.handler'

export const EventHandlers = [
  StockAdjustedHandler,
  StockIncrementedHandler,
  StockDecrementedHandler,
  IncomeOrderConfirmedHandler,
  WarrantyOrderCreatedHandler,
]
