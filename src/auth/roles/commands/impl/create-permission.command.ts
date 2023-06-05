import { AppRole } from '@prisma/client'

type CreatePermissionCommandProps = {
  name: string
  description: string
  roles?: AppRole[]
}

export class CreatePermissionCommand {
  constructor(public readonly data: CreatePermissionCommandProps) {}
}
