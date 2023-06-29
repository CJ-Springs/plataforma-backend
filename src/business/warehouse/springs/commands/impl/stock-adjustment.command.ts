type StockAdjustmentCommandProps = {
  code: string
  adjustment: number
}

export class StockAdjustmentCommand {
  constructor(public readonly data: StockAdjustmentCommandProps) {}
}
