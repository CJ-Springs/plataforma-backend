type ProductPriceIncreasedEventProps = {
  code: string
  price: number
}

export class ProductPriceIncreasedEvent {
  constructor(public readonly data: ProductPriceIncreasedEventProps) {}
}
