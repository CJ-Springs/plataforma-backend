import { AppRole } from '@prisma/client'

type PermissionCreatedEventProps = {
  id: string
  name: string
  description: string
  roles: AppRole[]
}

export class PermissionCreatedEvent {
  constructor(public readonly data: PermissionCreatedEventProps) {}
}
