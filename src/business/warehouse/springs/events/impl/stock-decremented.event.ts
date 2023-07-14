import { MovementReason } from '@/.shared/types'

type StockDecrementedEventProps = {
  code: string
  quantity: number
  updatedStock: number
  reason: MovementReason
}

export class StockDecrementedEvent {
  constructor(public readonly data: StockDecrementedEventProps) {}
}
