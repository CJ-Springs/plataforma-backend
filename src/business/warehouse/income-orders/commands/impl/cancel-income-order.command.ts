type CancelIncomeOrderCommandProps = {
  orderId: string
}

export class CancelIncomeOrderCommand {
  constructor(public readonly data: CancelIncomeOrderCommandProps) {}
}
