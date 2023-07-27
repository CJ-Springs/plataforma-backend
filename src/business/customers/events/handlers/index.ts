import { InvoiceGeneratedHandler } from './invoice-generated.handler'
import { PaymentAppendedHandler } from './payment-appended.handler'

export const EventHandlers = [InvoiceGeneratedHandler, PaymentAppendedHandler]
