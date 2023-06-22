import { ValueObject } from '@/.shared/domain'
import { AllowedCurrency, Currency, Result, Validate } from '@/.shared/helpers'

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
    const priceResult = Validate.combine([
      Validate.againstNullOrUndefined(props.price, 'price'),
      Validate.isGreaterThan(props.price, 0, 'price'),
    ])
    if (priceResult.isFailure) {
      return Result.fail(priceResult.getErrorValue())
    }

    const price = new Price({
      price: props.price,
      currency: Currency.create(props?.currency),
    })

    return Result.ok<Price>(price)
  }

  raiseByPercentage(percent: number): Price {
    const raise = this.props.price * (percent / 100)
    const sum = this.props.price + raise
    const rounded = Math.round(sum)

    return new Price({ price: rounded, currency: this.props.currency })
  }

  reduceByPercentage(percent: number): Price {
    const reduction = this.props.price * (percent / 100)
    const difference = this.props.price - reduction
    const rounded = Math.round(difference)

    return new Price({ price: rounded, currency: this.props.currency })
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
