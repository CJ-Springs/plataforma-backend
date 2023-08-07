type CancelPaymentCommandProps = {
  paymentId: string
  canceledBy: string
}

export class CancelPaymentCommand {
  constructor(public readonly data: CancelPaymentCommandProps) {}
}
