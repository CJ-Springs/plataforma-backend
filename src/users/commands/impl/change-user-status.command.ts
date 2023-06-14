type ChangeUserStatusCommandProps = {
  id: string
}

export class ChangeUserStatusCommand {
  constructor(public readonly data: ChangeUserStatusCommandProps) {}
}
