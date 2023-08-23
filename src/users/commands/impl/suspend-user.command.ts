type SuspendUserCommandProps = {
  userId: string
}

export class SuspendUserCommand {
  constructor(public readonly data: SuspendUserCommandProps) {}
}
