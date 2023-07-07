type ItemAddedEventProps = {
  id: string
  orderId: string
  productCode: string
  entered: number
}

export class ItemAddedEvent {
  constructor(public readonly data: ItemAddedEventProps) {}
}
