type WarrantyOrderCreatedEventProps = {
  id: string
  createdBy: string
  customerCode: number
  observation?: string
  items: {
    id: string
    productCode: string
    requested: number
  }[]
}

export class WarrantyOrderCreatedEvent {
  constructor(public readonly data: WarrantyOrderCreatedEventProps) {}
}
