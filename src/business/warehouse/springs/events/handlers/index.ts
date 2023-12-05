import { StockAdjustedHandler } from './stock-adjusted.handler'
import { IncomeOrderConfirmedHandler } from './income-order-confirmed.handler'
import { StockIncrementedHandler } from './stock-incremented.handler'
import { WarrantyOrderCreatedHandler } from './warranty-order-created.handler'
import { StockDecrementedHandler } from './stock-decremented.handler'
import { SaleOrderPlacedHandler } from './sale-order-placed.handler'
import { CreditNoteMadeHandler } from './credit-note-made.handler'

export const EventHandlers = [
  StockAdjustedHandler,
  StockIncrementedHandler,
  StockDecrementedHandler,
  IncomeOrderConfirmedHandler,
  SaleOrderPlacedHandler,
  WarrantyOrderCreatedHandler,
  CreditNoteMadeHandler,
]
