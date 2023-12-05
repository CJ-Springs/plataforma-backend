import { PaymentMethod } from '@prisma/client'

type AddPaymentCommandProps = {
  invoiceId: string
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  depositId?: string
  metadata?: Record<string, any>
}

export class AddPaymentCommand {
  constructor(public readonly data: AddPaymentCommandProps) {}
}
