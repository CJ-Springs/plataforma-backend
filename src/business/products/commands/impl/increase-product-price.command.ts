type IncreaseProductPriceCommandProps = {
  code: string
  percentage: number
}

export class IncreaseProductPriceCommand {
  constructor(public readonly data: IncreaseProductPriceCommandProps) {}
}
