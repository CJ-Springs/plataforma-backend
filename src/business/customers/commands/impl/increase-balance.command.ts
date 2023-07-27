type IncreaseBalanceCommandProps = {
  code: number
  increment: number
}

export class IncreaseBalanceCommand {
  constructor(public readonly data: IncreaseBalanceCommandProps) {}
}
