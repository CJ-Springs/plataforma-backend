import { AllowedCurrency } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { PriceIncreasedEvent } from '../events/impl/price-increased.event'
import { Currency, Result, Validate } from '@/.shared/helpers'
import { IAggregateToDTO } from '@/.shared/types'
import { UniqueField } from '@/.shared/domain'

type PricingProps = {
  productCode: UniqueField
  currency: Currency
  price: number
}

export type PricingPropsDTO = {
  productCode: string
  currency: AllowedCurrency
  price: number
}

export class Pricing
  extends AggregateRoot
  implements IAggregateToDTO<PricingPropsDTO>
{
  private constructor(public props: PricingProps) {
    super()
  }

  static create(props: PricingPropsDTO): Result<Pricing> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.productCode, argumentName: 'productCode' },
        { argument: props.price, argumentName: 'price' },
      ]),
      Validate.isGreaterThan(props.price, 0, 'price'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const price = new Pricing({
      productCode: new UniqueField(props.productCode),
      price: props.price,
      currency: Currency.create(props?.currency),
    })

    return Result.ok<Pricing>(price)
  }

  increaseByPercentage(percentage: number): Result<Pricing> {
    const increase = this.props.price * (percentage / 100)
    const sum = this.props.price + increase
    const rounded = Math.round(sum)

    this.props.price = rounded

    const event = new PriceIncreasedEvent({
      price: this.props.price,
      code: this.props.productCode.toString(),
    })
    this.apply(event)

    return Result.ok<Pricing>(this)
  }

  reduceByPercentage(percentage: number): Result<Pricing> {
    const reduction = this.props.price * (percentage / 100)
    const difference = this.props.price - reduction
    const rounded = Math.round(difference)

    this.props.price = rounded

    // TODO: Do event
    // const event = new PriceUpdatedEvent({
    //   price: this.props.price,
    //   code: this.props.productCode.toString(),
    // })
    // this.apply(event)

    return Result.ok<Pricing>(this)
  }

  getValue(): PricingProps {
    return this.props
  }

  toDTO(): PricingPropsDTO {
    return {
      ...this.props,
      productCode: this.props.productCode.toString(),
      currency: this.props.currency.getValue(),
    }
  }
}
