import { Currencies } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { PriceIncreasedEvent } from '../events/impl/price-increased.event'
import { PriceReducedEvent } from '../events/impl/price-reduced.event'
import { PriceManuallyUpdatedEvent } from '../events/impl/price-manually-updated.event'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'
import { UniqueField } from '@/.shared/domain'

type PriceProps = {
  productCode: UniqueField
  price: Money
}

export type PricePropsDTO = {
  productCode: string
  currency: Currencies
  price: number
}

export class Price extends AggregateRoot implements IToDTO<PricePropsDTO> {
  private constructor(public props: PriceProps) {
    super()
  }

  static create(props: PricePropsDTO): Result<Price> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefined(props.productCode, 'productCode'),
      Money.validate(props.price, 'price'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const price = new Price({
      productCode: new UniqueField(props.productCode),
      price: Money.fromString(
        String(props.price),
        Currency.create(props.currency ?? Currencies.ARS),
      ),
    })

    return Result.ok<Price>(price)
  }

  manuallyUpdatePrice(newPrice: number): Result<Price> {
    const guardResult = Money.validate(newPrice, 'price')
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue().message)
    }

    this.props.price = Money.fromString(
      String(newPrice),
      this.props.price.getCurrency(),
    )

    const event = new PriceManuallyUpdatedEvent({
      price: this.props.price.getValue(),
      code: this.props.productCode.toString(),
    })
    this.apply(event)

    return Result.ok<Price>(this)
  }

  increaseByPercentage(percentage: number): Result<Price> {
    this.props.price = this.props.price.increaseByPercentage(percentage)

    const event = new PriceIncreasedEvent({
      price: this.props.price.getValue(),
      code: this.props.productCode.toString(),
    })
    this.apply(event)

    return Result.ok<Price>(this)
  }

  reduceByPercentage(percentage: number): Result<Price> {
    this.props.price = this.props.price.reduceByPercentage(percentage)

    const event = new PriceReducedEvent({
      price: this.props.price.getValue(),
      code: this.props.productCode.toString(),
    })
    this.apply(event)

    return Result.ok<Price>(this)
  }

  toDTO(): PricePropsDTO {
    return {
      ...this.props,
      productCode: this.props.productCode.toString(),
      price: this.props.price.getValue(),
      currency: this.props.price.getCurrency().getValue(),
    }
  }
}
