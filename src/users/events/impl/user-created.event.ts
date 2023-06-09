import { AppRole } from '@prisma/client'

type UserCreatedEventProps = {
  id: string
  email: string
  password: string
  isSuspended: boolean
  profile: {
    firstname: string
    lastname: string
    phone: string
    document: number
  }
  role: AppRole
}

export class UserCreatedEvent {
  constructor(public readonly data: UserCreatedEventProps) {}
}
