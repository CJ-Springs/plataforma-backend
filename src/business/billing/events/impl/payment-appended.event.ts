import { PaymentMethod, PaymentStatus } from '@prisma/client'

type PaymentAppendedEventProps = {
  invoiceId: string
  orderId: string
  deposited: number
  total: number
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

export class PaymentAppendedEvent {
  constructor(public readonly data: PaymentAppendedEventProps) {}
}
