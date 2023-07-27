type InvoicePaidEventProps = {
  id: string
}

export class InvoicePaidEvent {
  constructor(public readonly data: InvoicePaidEventProps) {}
}
