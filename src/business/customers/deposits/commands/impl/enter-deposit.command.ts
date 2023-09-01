import { PaymentMethod } from '@prisma/client'

type EnterDepositCommandProps = {
  customerCode: number
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  metadata?: Record<string, any>
}

export class EnterDepositCommand {
  constructor(public readonly data: EnterDepositCommandProps) {}
}
