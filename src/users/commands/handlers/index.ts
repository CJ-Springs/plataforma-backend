import { CreateUserHandler } from './create-user.handler'
import { ChangeUserStatusHandler } from './change-user-status.handler'
import { ChangeUserPasswordHandler } from './change-user-password.handler'
import { UpdateUserRolesHandler } from './update-user-roles.handler'

export const CommandHandlers = [
  CreateUserHandler,
  ChangeUserStatusHandler,
  ChangeUserPasswordHandler,
  UpdateUserRolesHandler,
]
