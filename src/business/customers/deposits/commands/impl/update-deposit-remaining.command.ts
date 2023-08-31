type UpdateDepositRemainingCommandProps = {
  depositId: string
  remaining: number
}

export class UpdateDepositRemainingCommand {
  constructor(public readonly data: UpdateDepositRemainingCommandProps) {}
}
