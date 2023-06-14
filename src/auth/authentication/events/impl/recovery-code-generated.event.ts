type RecoveryCodeGeneratedEventProps = {
  userId: string
  email: string
  code: number
}

export class RecoveryCodeGeneratedEvent {
  constructor(public readonly data: RecoveryCodeGeneratedEventProps) {}
}
