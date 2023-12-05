import { AppRole } from '@prisma/client'

type CreateUserCommandProps = {
  email: string
  roles: AppRole[]
  profile: {
    firstname: string
    lastname: string
    phone: string
    document: number
  }
}

export class CreateUserCommand {
  constructor(public readonly data: CreateUserCommandProps) {}
}
