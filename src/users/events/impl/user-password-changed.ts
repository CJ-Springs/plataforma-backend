type UserPasswordChangedEventProps = {
  id: string
  password: string
}

export class UserPasswordChangedEvent {
  constructor(public readonly data: UserPasswordChangedEventProps) {}
}
