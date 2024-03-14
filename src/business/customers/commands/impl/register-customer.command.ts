type RegisterCustomerCommandProps = {
  name: string
  code: number
  email: string
  cuil?: string
  phone: string
  paymentDeadline: number
  discount?: number
  address: {
    country?: string
    province: string
    city: string
    locality?: string
    address: string
  }
}

export class RegisterCustomerCommand {
  constructor(public readonly data: RegisterCustomerCommandProps) {}
}
