import { InvoiceStatus } from '@prisma/client'

type PaymentCanceledEventProps = {
  invoiceId: string
  orderId: string
  status: InvoiceStatus
  payment: {
    id: string
    totalAmount: number
    netAmount: number
    remaining: number
    canceledBy: string
  }
}

export class PaymentCanceledEvent {
  constructor(public readonly data: PaymentCanceledEventProps) {}
}
