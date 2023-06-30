import { MovementType } from '@prisma/client'
import { MovementReason } from '@/.shared/types'

type RegisterMovementCommandProps = {
  code: string
  quantity: number
  updatedStock: number
  type: MovementType
  reason: MovementReason
}

export class RegisterMovementCommand {
  constructor(public readonly data: RegisterMovementCommandProps) {}
}
