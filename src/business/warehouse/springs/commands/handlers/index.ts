import { AttachTechnicalSheetHandler } from './attach-technical-sheet.handler'
import { EditTechnicalSheetHandler } from './edit-technical-sheet.handlers'
import { MinStockUpdateHandler } from './min-stock-update.handler'
import { StockAdjustmentHandler } from './stock-adjustment.handler'
import { RegisterMovementHandler } from './register-movement.handler'

export const CommandHandlers = [
  AttachTechnicalSheetHandler,
  EditTechnicalSheetHandler,
  StockAdjustmentHandler,
  MinStockUpdateHandler,
  RegisterMovementHandler,
]
