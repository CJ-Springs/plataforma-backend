type GenerateInvoiceCommandProps = {
  orderId: string
  createdBy: string
  items: {
    productCode: string
    salePrice: number
    quantity: number
  }[]
}

export class GenerateInvoiceCommand {
  constructor(public readonly data: GenerateInvoiceCommandProps) {}
}
