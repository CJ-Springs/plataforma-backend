import { ValueObject } from '@/.shared/domain'
import { Result, ValidateResult } from '@/.shared/helpers'
import { Validate } from '@/.shared/helpers'
import { passwordRegExp } from '@/.shared/utils/passwordValidation'

type PasswordProps = {
  password: string
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props)
  }

  static create(props: PasswordProps): Result<Password> {
    const guardResult = Validate.againstNullOrUndefined(
      props.password,
      'password',
    )
    if (guardResult.isFailure) {
      return Result.fail<Password>(guardResult.getErrorValue())
    }

    const propResult = Validate.combine([
      Validate.againstAtLeast(8, props.password, 'password'),
      Password.validatePassword(props.password, 'password'),
    ])
    if (propResult.isFailure) {
      return Result.fail(propResult.getErrorValue())
    }

    return Result.ok<Password>(new Password(props))
  }

  private static validatePassword(
    argument: string,
    argumentName: string,
  ): Result<ValidateResult> {
    if (!passwordRegExp.test(argument)) {
      return Result.fail({ success: false, message: `invalid ${argumentName}` })
    }

    return Result.ok({ success: true })
  }

  getValue(): string {
    return this.props.password
  }
}
