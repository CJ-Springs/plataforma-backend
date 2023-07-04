import { AllowedCurrency } from '@prisma/client'
import { ValueObject } from '@/.shared/domain'
import { Currency, Result, Validate } from '@/.shared/helpers'

type PriceProps = {
  currency: Currency
  price: number
}

export type PricePropsDTO = {
  currency: AllowedCurrency
  price: number
}

export class Price extends ValueObject<PriceProps> {
  private constructor(props: PriceProps) {
    super(props)
  }

  static create(props: Partial<PricePropsDTO>): Result<Price> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefined(props.price, 'price'),
      Validate.isGreaterThan(props.price, 0, 'price'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const price = new Price({
      price: props.price,
      currency: Currency.create(props?.currency),
    })

    return Result.ok<Price>(price)
  }

  getValue(): PriceProps {
    return this.props
  }

  toDTO(): PricePropsDTO {
    return {
      ...this.props,
      currency: this.props.currency.getValue(),
    }
  }
}
