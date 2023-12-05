type BalanceReducedEventProps = {
  code: number
  reduction: number
  balance: number
}

export class BalanceReducedEvent {
  constructor(public readonly data: BalanceReducedEventProps) {}
}
