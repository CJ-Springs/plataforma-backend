type IncomeOrderCancelledEventProps = {
  orderId: string
}

export class IncomeOrderCancelledEvent {
  constructor(public readonly data: IncomeOrderCancelledEventProps) {}
}
