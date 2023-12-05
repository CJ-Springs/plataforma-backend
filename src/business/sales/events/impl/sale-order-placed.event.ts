type SaleOrderPlacedEventProps = {
  id: string
  createdBy: string
  customerCode: number
  items: {
    id: string
    productCode: string
    requested: number
    price: number
    discount?: number
    salePrice: number
  }[]
}

export class SaleOrderPlacedEvent {
  constructor(public readonly data: SaleOrderPlacedEventProps) {}
}
