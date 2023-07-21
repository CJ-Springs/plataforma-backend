type InvoiceDuedEventProps = {
  id: string
}

export class InvoiceDuedEvent {
  constructor(public readonly data: InvoiceDuedEventProps) {}
}
