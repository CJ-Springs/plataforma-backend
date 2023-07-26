import { PaymentMethod } from '@prisma/client'

type EnterPaymentCommandProps = {
  invoiceId: string
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  mpUser?: string
  voucherNumber?: number
  operationNumber?: number
  cvu?: number
  code?: number
  paymentDate?: Date
}

export class EnterPaymentCommand {
  constructor(public readonly data: EnterPaymentCommandProps) {}
}
