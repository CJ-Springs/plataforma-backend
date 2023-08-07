type IncrementAmountOfSalesCommandProps = {
  code: string
  increment: number
}

export class IncrementAmountOfSalesCommand {
  constructor(public readonly data: IncrementAmountOfSalesCommandProps) {}
}
