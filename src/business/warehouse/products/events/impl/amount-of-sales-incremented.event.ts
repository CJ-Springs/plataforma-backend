type AmountOfSalesIncrementedEventProps = {
  code: string
  increment: number
  amountOfSales: number
}

export class AmountOfSalesIncrementedEvent {
  constructor(public readonly data: AmountOfSalesIncrementedEventProps) {}
}
