type UserStatusChangedEventProps = {
  id: string
  isSuspended: boolean
}

export class UserStatusChangedEvent {
  constructor(public readonly data: UserStatusChangedEventProps) {}
}
