import { AppRole } from '@prisma/client'

type PermissionAssignedProps = {
  permission: string
  role: AppRole
}

export class PermissionAssigned {
  constructor(public readonly data: PermissionAssignedProps) {}
}
