import { AppRole } from '@prisma/client'

type RoleCreatedEventProps = {
  id: string
  code: AppRole
  name: string
  permissions: string[]
}

export class RoleCreatedEvent {
  constructor(public readonly data: RoleCreatedEventProps) {}
}
