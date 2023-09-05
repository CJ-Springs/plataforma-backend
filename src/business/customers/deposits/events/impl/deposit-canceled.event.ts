type DepositCanceledEventProps = {
  depositId: string
  customerCode: number
  amount: number
  remaining: number
  canceledBy: string
}

export class DepositCanceledEvent {
  constructor(public readonly data: DepositCanceledEventProps) {}
}
