import { SaleOrderPlacedHandler } from './sale-order-placed.handler'
import { PaymentAddedHandler } from './payment-added.handler'
import { CreditNoteMadeHandler } from './credit-note-made.handler'
import { DepositMadeHandler } from './deposit-made.handler'

export const EventHandlers = [
  SaleOrderPlacedHandler,
  PaymentAddedHandler,
  DepositMadeHandler,
  CreditNoteMadeHandler,
]
