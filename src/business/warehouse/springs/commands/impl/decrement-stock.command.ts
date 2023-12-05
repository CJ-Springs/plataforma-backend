import { MovementReason } from '@/.shared/types'

type DecrementStockCommandProps = {
  code: string
  requested: number
  reason: MovementReason
}

export class DecrementStockCommand {
  constructor(public readonly data: DecrementStockCommandProps) {}
}
