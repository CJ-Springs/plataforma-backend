import { MovementReason } from '@/.shared/types'

type IncrementStockCommandProps = {
  code: string
  entered: number
  reason: MovementReason
}

export class IncrementStockCommand {
  constructor(public readonly data: IncrementStockCommandProps) {}
}
