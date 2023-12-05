import { IncomeOrderStatus } from '@prisma/client'

type IncomeOrderConfirmedEventProps = {
  id: string
  status: IncomeOrderStatus
  userId: string
  items: { id: string; entered: number; productCode: string }[]
}

export class IncomeOrderConfirmedEvent {
  constructor(public readonly data: IncomeOrderConfirmedEventProps) {}
}
