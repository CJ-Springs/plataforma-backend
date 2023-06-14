import { RecoveryCodeGeneratedHandler } from './recovery-code-generated.handler'
import { UserCreatedHandler } from './user-created.handler'

export const EventHandlers = [UserCreatedHandler, RecoveryCodeGeneratedHandler]
