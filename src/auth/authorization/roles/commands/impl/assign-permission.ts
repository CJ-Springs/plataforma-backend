import { AppRole } from '@prisma/client'

type AssignPermissionCommandProps = {
  permission: string
  role: AppRole
}

export class AssignPermissionCommand {
  constructor(public readonly data: AssignPermissionCommandProps) {}
}
