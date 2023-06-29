import { AttachTechnicalSheetHandler } from './attach-technical-sheet.handler'
import { EditTechnicalSheetHandler } from './edit-technical-sheet.handlers'
import { RegisterMovementHandler } from './register-movement.handler'
import { StockAdjustmentHandler } from './stock-adjustment.handler'

export const CommandHandlers = [
  AttachTechnicalSheetHandler,
  EditTechnicalSheetHandler,
  StockAdjustmentHandler,
  RegisterMovementHandler,
]
