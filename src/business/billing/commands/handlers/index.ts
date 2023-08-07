import { GenerateInvoiceHandler } from './generate-invoice.handler'
import { DueInvoiceHandler } from './due-invoice.handler'
import { AppendPaymentHandler } from './append-payment.handler'
import { CancelPaymentHandler } from './cancel-payment.handler'

export const CommandHandlers = [
  GenerateInvoiceHandler,
  DueInvoiceHandler,
  AppendPaymentHandler,
  CancelPaymentHandler,
]
