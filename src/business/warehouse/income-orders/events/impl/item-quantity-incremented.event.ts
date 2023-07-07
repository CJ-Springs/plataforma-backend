type ItemQuantityIncrementedEventProps = {
  id: string
  entered: number
}

export class ItemQuantityIncrementedEvent {
  constructor(public readonly data: ItemQuantityIncrementedEventProps) {}
}
