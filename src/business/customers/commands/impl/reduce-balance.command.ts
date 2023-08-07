type ReduceBalanceCommandProps = {
  code: number
  reduction: number
}

export class ReduceBalanceCommand {
  constructor(public readonly data: ReduceBalanceCommandProps) {}
}
