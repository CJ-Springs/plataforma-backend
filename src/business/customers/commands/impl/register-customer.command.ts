type RegisterCustomerCommandProps = {
  name: string
  code: number
  email: string
  cuil: number
  phone: number
  paymentDeadline: number
  discount?: number
  address: {
    province: string
    city: string
    locality: string
    address: string
  }
}

export class RegisterCustomerCommand {
  constructor(public readonly data: RegisterCustomerCommandProps) {}
}
