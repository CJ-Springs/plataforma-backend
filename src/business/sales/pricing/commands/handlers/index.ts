import { IncreasePriceHandler } from './increase-price.handler'
import { ManuallyUpdatePriceHandler } from './manually-update-price.handler'

export const CommandHandlers = [
  IncreasePriceHandler,
  ManuallyUpdatePriceHandler,
]
