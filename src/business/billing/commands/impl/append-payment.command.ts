import { PaymentMethod } from '@prisma/client'

type AppendPaymentCommandProps = {
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
  thirdParty?: boolean
}

export class AppendPaymentCommand {
  constructor(public readonly data: AppendPaymentCommandProps) {}
}
