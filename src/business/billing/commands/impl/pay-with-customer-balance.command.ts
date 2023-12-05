type PayWithCustomerBalanceCommandProps = {
  invoiceId: string
  createdBy: string
}

export class PayWithCustomerBalanceCommand {
  constructor(public readonly data: PayWithCustomerBalanceCommandProps) {}
}
