type UserDeletedEventProps = {
  id: string
}

export class UserDeletedEvent {
  constructor(public readonly data: UserDeletedEventProps) {}
}
