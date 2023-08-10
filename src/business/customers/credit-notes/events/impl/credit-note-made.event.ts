type CreditNoteMadeEventProps = {
  id: string
  createdBy: string
  customerCode: number
  observation?: string
  items: {
    id: string
    productCode: string
    returned: number
    price: number
  }[]
}

export class CreditNoteMadeEvent {
  constructor(public readonly data: CreditNoteMadeEventProps) {}
}
