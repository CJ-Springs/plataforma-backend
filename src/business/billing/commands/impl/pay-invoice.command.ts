type PayInvoiceCommandProps = {
  invoiceId: string
}

export class PayInvoiceCommand {
  constructor(public readonly data: PayInvoiceCommandProps) {}
}
