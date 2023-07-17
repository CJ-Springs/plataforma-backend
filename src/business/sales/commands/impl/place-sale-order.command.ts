type PlaceSaleOrderCommandProps = {
  customerCode: number
  createdBy: string
  items: {
    productCode: string
    requested: number
    discount?: number
  }[]
}

export class PlaceSaleOrderCommand {
  constructor(public readonly data: PlaceSaleOrderCommandProps) {}
}
