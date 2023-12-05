import { EnterDepositHandler } from './enter-deposit.handler'
import { AddRemainingToDepositHandler } from './add-remaining-to-deposit.handler'
import { CancelDepositHandler } from './cancel-deposit.handler'

export const CommandHandlers = [
  EnterDepositHandler,
  CancelDepositHandler,
  AddRemainingToDepositHandler,
]
