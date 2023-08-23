type ActivateUserCommandProps = {
  userId: string
}

export class ActivateUserCommand {
  constructor(public readonly data: ActivateUserCommandProps) {}
}
