import { ValueObject } from '@/.shared/domain'
import { CountryCode, Result } from '@/.shared/helpers'
import { Validate } from '@/.shared/helpers'

type AddressProps = {
  country: CountryCode
  province: string
  city: string
  locality?: string
  address: string
}

export type AddressPropsDTO = {
  countryCode: string
  country: string
  province: string
  city: string
  locality?: string
  address: string
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props)
  }

  static create(props: Partial<AddressPropsDTO>): Result<Address> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.province, argumentName: 'province' },
      { argument: props.city, argumentName: 'city' },
      { argument: props.address, argumentName: 'address' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const atLeastOneRequiredResult = Validate.isAnyRequired(
      props,
      'country',
      'countryCode',
    )
    if (!atLeastOneRequiredResult.success) {
      return Result.fail(atLeastOneRequiredResult.message)
    }

    const countryResult = props?.country
      ? CountryCode.createFromCountry(props.country)
      : CountryCode.createFromCountryCode(props.countryCode)
    if (countryResult.isFailure) {
      return Result.fail(countryResult.getErrorValue())
    }

    const address = new Address({
      country: countryResult.getValue(),
      province: props.province,
      city: props.city,
      locality: props.locality,
      address: props.address,
    })

    return Result.ok<Address>(address)
  }

  getValue(): AddressProps {
    return this.props
  }

  toDTO(): AddressPropsDTO {
    return {
      ...this.props,
      countryCode: this.props.country.props.countryCode,
      country: this.props.country.props.country,
    }
  }
}
