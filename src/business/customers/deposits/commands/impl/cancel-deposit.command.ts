type CancelDepositCommandProps = {
  depositId: string
  canceledBy: string
}

export class CancelDepositCommand {
  constructor(public readonly data: CancelDepositCommandProps) {}
}
