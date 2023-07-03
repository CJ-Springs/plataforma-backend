type PriceIncreasedEventProps = {
  code: string
  price: number
}

export class PriceIncreasedEvent {
  constructor(public readonly data: PriceIncreasedEventProps) {}
}
