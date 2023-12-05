import { ValueObject } from '@/.shared/domain'
import { Result } from '@/.shared/helpers'
import { Validate } from '@/.shared/helpers'

type ProfileProps = {
  firstname: string
  lastname: string
  phone: string
  document: number
}

export class Profile extends ValueObject<ProfileProps> {
  private constructor(props: ProfileProps) {
    super(props)
  }

  static create(props: Partial<ProfileProps>): Result<Profile> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.firstname, argumentName: 'firstname' },
      { argument: props.lastname, argumentName: 'lastname' },
      { argument: props.phone, argumentName: 'phone' },
      { argument: props.lastname, argumentName: 'lastname' },
    ])

    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const propsResult = Validate.combine([
      Validate.inRange(props.firstname.length, 3, 55, 'firstname length'),
      Validate.inRange(props.lastname.length, 3, 55, 'lastname length'),
      Validate.isGreaterOrEqualThan(props.document, 1_000_000, 'document'),
    ])
    if (propsResult.isFailure) {
      return Result.fail(propsResult.getErrorValue())
    }

    const profile = new Profile({
      firstname: props.firstname,
      lastname: props.lastname,
      document: props.document,
      phone: props.phone,
    })

    return Result.ok<Profile>(profile)
  }

  getValue(): ProfileProps {
    return this.props
  }
}
