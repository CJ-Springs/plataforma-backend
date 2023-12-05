type IncreasePriceCommandProps = {
  code: string
  percentage: number
}

export class IncreasePriceCommand {
  constructor(public readonly data: IncreasePriceCommandProps) {}
}
