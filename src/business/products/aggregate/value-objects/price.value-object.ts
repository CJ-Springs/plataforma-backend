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

  increaseByPercentage(percentage: number): Price {
    const increase = this.props.price * (percentage / 100)
    const sum = this.props.price + increase
    const rounded = Math.round(sum)

    return new Price({ price: rounded, currency: this.props.currency })
  }

  reduceByPercentage(percentage: number): Price {
    const reduction = this.props.price * (percentage / 100)
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
