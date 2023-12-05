import * as countries from 'i18n-iso-countries'
import { ValueObject } from '../domain/ValueObject'
import { Result } from './Result'
import { Validate, ValidateResult } from './Validate'

type CountryCodeProps = {
  country: string
  countryCode: string
}

export class CountryCode extends ValueObject<CountryCodeProps> {
  private constructor(props: CountryCodeProps) {
    super(props)
  }

  static createFromCountry(country: string): Result<CountryCode> {
    const nullPropResult = Validate.againstNullOrUndefined(country, 'country')

    if (nullPropResult.isFailure) {
      return Result.fail(nullPropResult.getErrorValue())
    }

    const countryCode = countries.getAlpha3Code(
      country.trim().toLowerCase(),
      'es',
    )

    const validateCountryResult = CountryCode.validateCountry(
      countryCode,
      'countryCode',
    )
    if (!validateCountryResult.success) {
      return Result.fail(validateCountryResult.message)
    }

    return Result.ok(new CountryCode({ country: country.trim(), countryCode }))
  }

  static createFromCountryCode(countryCode: string): Result<CountryCode> {
    const nullPropResult = Validate.againstNullOrUndefined(
      countryCode,
      'country',
    )
    if (nullPropResult.isFailure) {
      return Result.fail(nullPropResult.getErrorValue())
    }

    const validateCountryResult = CountryCode.validateCountry(
      countryCode,
      'countryCode',
    )
    if (!validateCountryResult.success) {
      return Result.fail(validateCountryResult.message)
    }
    const country = countries.getName(countryCode.trim().toLowerCase(), 'es')
    return Result.ok(
      new CountryCode({
        country: country,
        countryCode: countryCode.trim().toUpperCase(),
      }),
    )
  }

  public static validateCountry(
    country: string,
    argumentName: string,
  ): ValidateResult {
    const countryCodeList = countries.isValid(country)

    if (!countryCodeList) {
      return {
        success: false,
        message: `the ${argumentName} should be a valid country`,
      }
    }

    return {
      success: true,
    }
  }
}
