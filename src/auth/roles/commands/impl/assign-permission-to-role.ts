import { AppRole } from '@prisma/client'

type AssignPermissionToRoleCommandProps = {
  permission: string
  roles: AppRole[]
}

export class AssignPermissionToRoleCommand {
  constructor(public readonly data: AssignPermissionToRoleCommandProps) {}
}
