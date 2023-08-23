type UserSuspendedEventProps = {
  userId: string
}

export class UserSuspendedEvent {
  constructor(public readonly data: UserSuspendedEventProps) {}
}
