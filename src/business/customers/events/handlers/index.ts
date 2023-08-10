import { InvoiceGeneratedHandler } from './invoice-generated.handler'
import { PaymentAddedHandler } from './payment-appended.handler'
import { PaymentCanceledHandler } from './payment-canceled.handler'

export const EventHandlers = [
  InvoiceGeneratedHandler,
  PaymentAddedHandler,
  PaymentCanceledHandler,
]
