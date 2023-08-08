import { PaymentMethod } from '@prisma/client'

type AddPaymentCommandProps = {
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

export class AddPaymentCommand {
  constructor(public readonly data: AddPaymentCommandProps) {}
}
