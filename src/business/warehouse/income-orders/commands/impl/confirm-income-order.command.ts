type ConfirmIncomeOrderCommandProps = {
  orderId: string
}

export class ConfirmIncomeOrderCommand {
  constructor(public readonly data: ConfirmIncomeOrderCommandProps) {}
}
