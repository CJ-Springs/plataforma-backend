import { InvoiceStatus } from '@prisma/client'

type PaymentAmountReducedEventProps = {
  invoiceId: string
  orderId: string
  status: InvoiceStatus
  payment: {
    id: string
    totalAmount: number
    netAmount: number
    reduction: number
  }
}

export class PaymentAmountReducedEvent {
  constructor(public readonly data: PaymentAmountReducedEventProps) {}
}
