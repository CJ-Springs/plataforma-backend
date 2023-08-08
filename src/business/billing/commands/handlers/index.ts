import { GenerateInvoiceHandler } from './generate-invoice.handler'
import { DueInvoiceHandler } from './due-invoice.handler'
import { AddPaymentHandler } from './add-payment.handler'
import { CancelPaymentHandler } from './cancel-payment.handler'

export const CommandHandlers = [
  GenerateInvoiceHandler,
  DueInvoiceHandler,
  AddPaymentHandler,
  CancelPaymentHandler,
]
