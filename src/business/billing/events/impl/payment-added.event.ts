import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'

type PaymentAddedEventProps = {
  invoiceId: string
  orderId: string
  status: InvoiceStatus
  remaining?: number
  payment: {
    id: string
    paymentMethod: PaymentMethod
    amount: number
    createdBy: string
    canceledBy?: string
    status: PaymentStatus
    metadata?: Record<string, any>
  }
}

export class PaymentAddedEvent {
  constructor(public readonly data: PaymentAddedEventProps) {}
}
