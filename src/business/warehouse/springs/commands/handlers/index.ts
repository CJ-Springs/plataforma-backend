import { AttachTechnicalSheetHandler } from './attach-technical-sheet.handler'
import { EditTechnicalSheetHandler } from './edit-technical-sheet.handler'
import { MinStockUpdateHandler } from './min-stock-update.handler'
import { StockAdjustmentHandler } from './stock-adjustment.handler'
import { RegisterMovementHandler } from './register-movement.handler'
import { IncrementStockHandler } from './increment-stock.handler'
import { DecrementStockHandler } from './decrement-stock.handler'

export const CommandHandlers = [
  AttachTechnicalSheetHandler,
  EditTechnicalSheetHandler,
  StockAdjustmentHandler,
  MinStockUpdateHandler,
  RegisterMovementHandler,
  IncrementStockHandler,
  DecrementStockHandler,
]
