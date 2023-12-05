import { UserCreatedHandler } from './user-created.handler'
import { UserDeletedHandler } from './user-deleted.handler'
import { RecoveryCodeGeneratedHandler } from './recovery-code-generated.handler'

export const EventHandlers = [
  UserCreatedHandler,
  UserDeletedHandler,
  RecoveryCodeGeneratedHandler,
]
