type BalanceIncreasedEventProps = {
  code: number
  increment: number
  balance: number
}

export class BalanceIncreasedEvent {
  constructor(public readonly data: BalanceIncreasedEventProps) {}
}
