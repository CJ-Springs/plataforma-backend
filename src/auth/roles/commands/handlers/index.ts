import { AssignPermissionToRoleHandler } from './assign-permission-to-role'
import { CreatePermissionHandler } from './create-permission.handler'
import { CreateRoleHandler } from './create-role.handler'

export const CommandHandlers = [
  CreateRoleHandler,
  CreatePermissionHandler,
  AssignPermissionToRoleHandler,
]
