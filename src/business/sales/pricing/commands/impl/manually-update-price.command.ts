type ManuallyUpdatePriceCommandProps = {
  code: string
  update: number
}

export class ManuallyUpdatePriceCommand {
  constructor(public readonly data: ManuallyUpdatePriceCommandProps) {}
}
