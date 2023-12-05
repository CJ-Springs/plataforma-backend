type ChangeUserPasswordCommandProps = {
  id: string
  password: string
}

export class ChangeUserPasswordCommand {
  constructor(public readonly data: ChangeUserPasswordCommandProps) {}
}
