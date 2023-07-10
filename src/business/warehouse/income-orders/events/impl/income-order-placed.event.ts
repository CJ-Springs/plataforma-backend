import { IncomeOrderStatus } from '@prisma/client'

type IncomeOrderPlacedEventProps = {
  id: string
  status: IncomeOrderStatus
  userId: string
  items: {
    id: string
    productCode: string
    entered: number
  }[]
}

export class IncomeOrderPlacedEvent {
  constructor(public readonly data: IncomeOrderPlacedEventProps) {}
}
