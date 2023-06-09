import { AppRole } from '@prisma/client'

type CreateRoleCommandProps = {
  role: AppRole
  permissions?: string[]
}

export class CreateRoleCommand {
  constructor(public readonly data: CreateRoleCommandProps) {}
}
