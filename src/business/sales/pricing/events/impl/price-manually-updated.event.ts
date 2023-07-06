type PriceManuallyUpdatedEventProps = {
  code: string
  price: number
}

export class PriceManuallyUpdatedEvent {
  constructor(public readonly data: PriceManuallyUpdatedEventProps) {}
}
