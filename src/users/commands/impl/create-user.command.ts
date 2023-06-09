import { AppRole } from '@prisma/client'

type CreateUserCommandProps = {
  email: string
  firstname: string
  lastname: string
  phone: string
  document: number
  role?: AppRole
}

export class CreateUserCommand {
  constructor(public readonly data: CreateUserCommandProps) {}
}
