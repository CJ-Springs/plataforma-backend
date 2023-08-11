import { AppRole } from '@prisma/client'

type UserRolesUpdatedEventProps = {
  userId: string
  removedRoles: AppRole[]
  newRoles: AppRole[]
  roles: AppRole[]
}

export class UserRolesUpdatedEvent {
  constructor(public readonly data: UserRolesUpdatedEventProps) {}
}
