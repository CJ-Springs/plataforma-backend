import { GenerateInvoiceHandler } from './generate-invoice.handler'
import { PayInvoiceHandler } from './pay-invoice.handler'
import { DueInvoiceHandler } from './due-invoice.handler'
import { AppendPaymentHandler } from './append-payment.handler'

export const CommandHandlers = [
  GenerateInvoiceHandler,
  PayInvoiceHandler,
  DueInvoiceHandler,
  AppendPaymentHandler,
]
