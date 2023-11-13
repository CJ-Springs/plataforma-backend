import { SaleOrderPlacedHandler } from './sale-order-placed.handler'
import { PaymentAddedHandler } from './payment-added.handler'
import { PaymentCanceledHandler } from './payment-canceled.handler'
import { DepositMadeHandler } from './deposit-made.handler'
import { DepositCanceledHandler } from './deposit-canceled.handler'
import { CreditNoteMadeHandler } from './credit-note-made.handler'
import { PaymentAmountReducedHandler } from './payment-amount-reduced.handler'

export const EventHandlers = [
  SaleOrderPlacedHandler,
  PaymentAddedHandler,
  PaymentCanceledHandler,
  PaymentAmountReducedHandler,
  DepositMadeHandler,
  DepositCanceledHandler,
  CreditNoteMadeHandler,
]
