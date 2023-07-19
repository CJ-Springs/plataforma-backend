import { InvoiceStatus } from '@prisma/client'

type InvoiceGeneratedEventProps = {
  id: string
  total: number
  deposited: number
  dueDate: Date
  status: InvoiceStatus
  orderId: string
}

export class InvoiceGeneratedEvent {
  constructor(public readonly data: InvoiceGeneratedEventProps) {}
}
