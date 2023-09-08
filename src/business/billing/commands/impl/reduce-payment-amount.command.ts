type ReducePaymentAmountCommandProps = {
  paymentId: string
  reduction: number
}

export class ReducePaymentAmountCommand {
  constructor(public readonly data: ReducePaymentAmountCommandProps) {}
}
