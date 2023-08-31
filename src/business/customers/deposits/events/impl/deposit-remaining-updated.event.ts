type DepositRemainingUpdatedEventProps = {
  id: string
  prevRemaining: number
  remaining: number
}

export class DepositRemainingUpdatedEvent {
  constructor(public readonly data: DepositRemainingUpdatedEventProps) {}
}
