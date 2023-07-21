type BalanceReducedEventProps = {
  code: number
  prevBalance: number
  reduction: number
  currentBalance: number
}

export class BalanceReducedEvent {
  constructor(public readonly data: BalanceReducedEventProps) {}
}
