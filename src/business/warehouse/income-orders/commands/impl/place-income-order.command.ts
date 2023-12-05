type PlaceIncomeOrderCommandProps = {
  userId: string
  items: {
    productCode: string
    entered: number
  }[]
}

export class PlaceIncomeOrderCommand {
  constructor(public readonly data: PlaceIncomeOrderCommandProps) {}
}
