import { SaleOrderPlacedHandler } from './sale-order-placed.handler'
import { PaymentAddedHandler } from './payment-added.handler'
import { CreditNoteMadeHandler } from './credit-note-made.handler'

export const EventHandlers = [
  SaleOrderPlacedHandler,
  PaymentAddedHandler,
  CreditNoteMadeHandler,
]
