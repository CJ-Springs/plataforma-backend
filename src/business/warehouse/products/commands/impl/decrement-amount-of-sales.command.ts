type DecrementAmountOfSalesCommandProps = {
  code: string
  reduction: number
}

export class DecrementAmountOfSalesCommand {
  constructor(public readonly data: DecrementAmountOfSalesCommandProps) {}
}
