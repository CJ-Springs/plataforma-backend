type CreateWarrantyOrderCommandProps = {
  customerCode: number
  createdBy: string
  items: {
    productCode: string
    requested: number
  }[]
}

export class CreateWarrantyOrderCommand {
  constructor(public readonly data: CreateWarrantyOrderCommandProps) {}
}
