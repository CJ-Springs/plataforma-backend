type InvoiceDuedEventProps = {
  id: string
  leftToPay: number
}

export class InvoiceDuedEvent {
  constructor(public readonly data: InvoiceDuedEventProps) {}
}
