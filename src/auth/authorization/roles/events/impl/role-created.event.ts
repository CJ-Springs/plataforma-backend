import { AppRole } from '@prisma/client'

type RoleCreatedEventProps = {
  id: string
  role: AppRole
  permissions: string[]
}

export class RoleCreatedEvent {
  constructor(public readonly data: RoleCreatedEventProps) {}
}
