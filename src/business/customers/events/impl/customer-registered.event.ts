type CustomerRegisteredEventProps = {
  id: string
  code: number
  email: string
  name: string
  phone: string
  cuil?: string
  balance: number
  paymentDeadline: number
  discount?: number
  address: {
    countryCode: string
    country: string
    province: string
    city: string
    locality?: string
    address: string
  }
}

export class CustomerRegisteredEvent {
  constructor(public readonly data: CustomerRegisteredEventProps) {}
}
