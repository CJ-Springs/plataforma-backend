import { PaymentMethod } from '@prisma/client'

type EnterDepositCommandProps = {
  customerCode: number
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

export class EnterDepositCommand {
  constructor(public readonly data: EnterDepositCommandProps) {}
}
