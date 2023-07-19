type GenerateInvoiceCommandProps = {
  orderId: string
  items: {
    productCode: string
    salePrice: number
    quantity: number
  }[]
}

export class GenerateInvoiceCommand {
  constructor(public readonly data: GenerateInvoiceCommandProps) {}
}
