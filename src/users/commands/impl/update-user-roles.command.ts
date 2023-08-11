import { AppRole } from '@prisma/client'

type UpdateUserRolesCommandProps = {
  userId: string
  roles: AppRole[]
}

export class UpdateUserRolesCommand {
  constructor(public readonly data: UpdateUserRolesCommandProps) {}
}
