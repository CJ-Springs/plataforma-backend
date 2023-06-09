import { ValueObject } from '../domain'
import { Result } from './Result'
import { Validate, ValidateResult } from './Validate'

type EmailProps = {
  email: string
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props)
  }

  static create(props: EmailProps): Result<Email> {
    const nullPropResult = Validate.againstNullOrUndefined(props.email, 'mail')
    if (!nullPropResult.isSuccess) {
      return Result.fail(nullPropResult.getErrorValue())
    }

    const propResult = Validate.combine([
      Validate.inRange(props.email.length, 3, 255, 'mail length'),
      Email.validateEmail(props.email, 'mail'),
    ])
    if (propResult.isFailure) {
      return Result.fail(propResult.getErrorValue())
    }

    return Result.ok(new Email(props))
  }

  private static validateEmail(
    mail: string,
    argumentName: string,
  ): Result<ValidateResult> {
    const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!re.test(mail)) {
      return Result.fail({
        success: false,
        message: `invalid ${argumentName}`,
      })
    }

    return Result.ok({
      success: true,
    })
  }

  getValue(): string {
    return this.props.email
  }
}
