type AmountOfSalesDecrementedEventProps = {
  code: string
  reduction: number
  amountOfSales: number
}

export class AmountOfSalesDecrementedEvent {
  constructor(public readonly data: AmountOfSalesDecrementedEventProps) {}
}
