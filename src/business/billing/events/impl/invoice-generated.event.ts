import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'

type InvoiceGeneratedEventProps = {
  id: string
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: string
  payments: {
    id: string
    paymentMethod: PaymentMethod
    amount: number
    remaining: number
    createdBy: string
    canceledBy?: string
    depositId?: string
    status: PaymentStatus
    metadata?: Record<string, any>
  }[]
}

export class InvoiceGeneratedEvent {
  constructor(public readonly data: InvoiceGeneratedEventProps) {}
}
