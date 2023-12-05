type AddRemainingToDepositCommandProps = {
  depositId: string
  addition: number
}

export class AddRemainingToDepositCommand {
  constructor(public readonly data: AddRemainingToDepositCommandProps) {}
}
