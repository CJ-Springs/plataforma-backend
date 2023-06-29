type StockAdjustedEventProps = {
  code: string
  quantity: number
  prevStock: number
  updatedStock: number
}

export class StockAdjustedEvent {
  constructor(public readonly data: StockAdjustedEventProps) {}
}
