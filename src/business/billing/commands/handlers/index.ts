import { GenerateInvoiceHandler } from './generate-invoice.handler'
import { DueInvoiceHandler } from './due-invoice.handler'
import { AddPaymentHandler } from './add-payment.handler'
import { PaymentWithCustomerBalanceHandler } from './payment-with-customer-balance.handler'
import { CancelPaymentHandler } from './cancel-payment.handler'
import { ReducePaymentAmountHandler } from './reduce-payment-amount.handler'

export const CommandHandlers = [
  GenerateInvoiceHandler,
  DueInvoiceHandler,
  AddPaymentHandler,
  PaymentWithCustomerBalanceHandler,
  CancelPaymentHandler,
  ReducePaymentAmountHandler,
]
