import { ValueObject } from '@/.shared/domain'
import { Result } from '@/.shared/helpers'
import { Validate } from '@/.shared/helpers'

type AddressProps = {
  province: string
  city: string
  locality: string
  address: string
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props)
  }

  static create(props: AddressProps): Result<Address> {
    const guardResult = Validate.againstNullOrUndefinedBulk([])
    if (guardResult.isFailure) {
      return Result.fail<Address>(guardResult.getErrorValue())
    }

    return Result.ok<Address>(new Address(props))
  }

  getValue(): AddressProps {
    return this.props
  }
}
