type PaymentWithCustomerBalanceCommandProps = {
  invoiceId: string
  createdBy: string
}

export class PaymentWithCustomerBalanceCommand {
  constructor(public readonly data: PaymentWithCustomerBalanceCommandProps) {}
}
