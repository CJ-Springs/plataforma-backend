type DueInvoiceCommandProps = {
  invoiceId: string
}

export class DueInvoiceCommand {
  constructor(public readonly data: DueInvoiceCommandProps) {}
}
