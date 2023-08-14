import { CreateUserHandler } from './create-user.handler'
import { ChangeUserPasswordHandler } from './change-user-password.handler'
import { UpdateUserRolesHandler } from './update-user-roles.handler'
import { ActivateUserHandler } from './activate-user.handler'
import { SuspendUserHandler } from './suspend-user.handler'

export const CommandHandlers = [
  CreateUserHandler,
  ChangeUserPasswordHandler,
  UpdateUserRolesHandler,
  ActivateUserHandler,
  SuspendUserHandler,
]
