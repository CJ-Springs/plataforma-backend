import { InvoiceGeneratedHandler } from './invoice-generated.handler'
import { PaymentAppendedHandler } from './payment-appended.handler'
import { PaymentCanceledHandler } from './payment-canceled.handler'

export const EventHandlers = [
  InvoiceGeneratedHandler,
  PaymentAppendedHandler,
  PaymentCanceledHandler,
]
