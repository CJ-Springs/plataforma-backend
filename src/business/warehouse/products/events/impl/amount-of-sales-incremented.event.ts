type AmountOfSalesIncrementedEventProps = {
  code: string
  prevAmount: number
  increment: number
  currentAmount: number
}

export class AmountOfSalesIncrementedEvent {
  constructor(public readonly data: AmountOfSalesIncrementedEventProps) {}
}
