import { MovementReason } from '@/.shared/types'

type StockIncrementedEventProps = {
  code: string
  quantity: number
  updatedStock: number
  reason: MovementReason
}

export class StockIncrementedEvent {
  constructor(public readonly data: StockIncrementedEventProps) {}
}
