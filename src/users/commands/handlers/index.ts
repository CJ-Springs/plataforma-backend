import { CreateUserHandler } from './create-user.handler'
import { ChangeUserStatusHandler } from './change-user-status.handler'
import { ChangeUserPasswordHandler } from './change-user-password.handler'

export const CommandHandlers = [
  CreateUserHandler,
  ChangeUserStatusHandler,
  ChangeUserPasswordHandler,
]
