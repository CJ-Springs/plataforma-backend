import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'

type PaymentAddedEventProps = {
  invoiceId: string
  orderId: string
  status: InvoiceStatus
  payment: {
    id: string
    paymentMethod: PaymentMethod
    totalAmount: number
    netAmount: number
    remaining: number
    createdBy: string
    canceledBy?: string
    depositId?: string
    status: PaymentStatus
    metadata?: Record<string, any>
  }
}

export class PaymentAddedEvent {
  constructor(public readonly data: PaymentAddedEventProps) {}
}
