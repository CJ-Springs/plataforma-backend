type PriceReducedEventProps = {
  code: string
  price: number
}

export class PriceReducedEvent {
  constructor(public readonly data: PriceReducedEventProps) {}
}
