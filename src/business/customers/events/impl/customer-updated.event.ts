type CustomerUpdatedEventProps = {
  code: number
  name?: string
  cuil?: string
  phone?: string
  paymentDeadline?: number
  discount?: number
  address?: {
    country?: string
    province?: string
    city?: string
    locality?: string
    address?: string
  }
}

export class CustomerUpdatedEvent {
  constructor(public readonly data: CustomerUpdatedEventProps) {}
}
