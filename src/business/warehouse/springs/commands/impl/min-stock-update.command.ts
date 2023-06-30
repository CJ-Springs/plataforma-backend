type MinStockUpdateCommandProps = {
  code: string
  update: number
}

export class MinStockUpdateCommand {
  constructor(public readonly data: MinStockUpdateCommandProps) {}
}
