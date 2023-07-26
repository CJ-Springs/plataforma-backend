import { PaymentMethod } from '@prisma/client'

type PaymentAppendedEventProps = {
  invoiceId: string
  deposited: number
  total: number
  payment: {
    id: string
    paymentMethod: PaymentMethod
    amount: number
    createdBy: string
    metadata?: Record<string, any>
  }
}

export class PaymentAppendedEvent {
  constructor(public readonly data: PaymentAppendedEventProps) {}
}
