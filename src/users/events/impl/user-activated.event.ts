type UserActivatedEventProps = {
  userId: string
}

export class UserActivatedEvent {
  constructor(public readonly data: UserActivatedEventProps) {}
}
