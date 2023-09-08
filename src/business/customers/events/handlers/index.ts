import { InvoiceGeneratedHandler } from './invoice-generated.handler'
import { PaymentAmountReducedHandler } from './payment-amount-reduced.handler'

export const EventHandlers = [
  InvoiceGeneratedHandler,
  PaymentAmountReducedHandler,
]
