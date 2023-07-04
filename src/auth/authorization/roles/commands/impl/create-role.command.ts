import { AppRole } from '@prisma/client'

type CreateRoleCommandProps = {
  code: AppRole
  name: string
  permissions?: string[]
}

export class CreateRoleCommand {
  constructor(public readonly data: CreateRoleCommandProps) {}
}
