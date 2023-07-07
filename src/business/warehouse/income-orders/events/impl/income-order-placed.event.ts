import { IncomeOrderStatus } from '@prisma/client'

type IncomeOrderPlacedEventProps = {
  id: string
  status: IncomeOrderStatus
  userId: string
}

export class IncomeOrderPlacedEvent {
  constructor(public readonly data: IncomeOrderPlacedEventProps) {}
}
