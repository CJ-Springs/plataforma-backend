import { PaymentMethod, PaymentStatus } from '@prisma/client'

type DepositMadeEventProps = {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  remaining: number
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
  metadata?: Record<string, any>
  customerCode: number
}

export class DepositMadeEvent {
  constructor(public readonly data: DepositMadeEventProps) {}
}
