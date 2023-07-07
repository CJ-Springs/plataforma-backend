type PlaceIncomeOrderCommandProps = {
  userId: string
}

export class PlaceIncomeOrderCommand {
  constructor(public readonly data: PlaceIncomeOrderCommandProps) {}
}
