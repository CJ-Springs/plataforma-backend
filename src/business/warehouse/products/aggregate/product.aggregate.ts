import { ProductType } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Price, PricePropsDTO } from './value-objects/price.value-object'
import { Spring, SpringPropsDTO } from './entities/spring.entity'
import { ProductAddedEvent } from '../events/impl/product-added.event'
import { ProductUpdatedEvent } from '../events/impl/product-updated.event'
import { AmountOfSalesIncrementedEvent } from '../events/impl/amount-of-sales-incremented.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type ProductProps = {
  id: UniqueEntityID
  code: UniqueField
  type: ProductType
  brand: string
  model: string
  description?: string
  isGnc: boolean
  amountOfSales: number
  price: Price
  spring: Spring
}

type ProductPropsDTO = {
  id: string
  code: string
  type: ProductType
  brand: string
  model: string
  description?: string
  isGnc: boolean
  amountOfSales: number
  price: PricePropsDTO
  spring: SpringPropsDTO
}

type UpdateProductProps = Partial<
  Pick<ProductPropsDTO, 'brand' | 'model' | 'description' | 'type' | 'isGnc'>
>

export class Product extends AggregateRoot implements IToDTO<ProductPropsDTO> {
  private constructor(public props: ProductProps) {
    super()
  }

  static create(props: DeepPartial<ProductPropsDTO>): Result<Product> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.brand, argumentName: 'brand' },
      { argument: props.model, argumentName: 'model' },
      { argument: props.isGnc, argumentName: 'isGnc' },
      { argument: props.amountOfSales, argumentName: 'amountOfSales' },
      { argument: props.price, argumentName: 'price' },
      { argument: props.spring, argumentName: 'spring' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const priceResult = Price.create(props.price)
    if (priceResult.isFailure) {
      return Result.fail(priceResult.getErrorValue())
    }

    const springResult = Spring.create(props.spring)
    if (springResult.isFailure) {
      return Result.fail(springResult.getErrorValue())
    }

    const product = new Product({
      id: new UniqueEntityID(props?.id),
      code: new UniqueField(props.code),
      type: props.type,
      brand: props.brand,
      model: props.model,
      isGnc: props.isGnc,
      amountOfSales: props.amountOfSales,
      description: props?.description,
      price: priceResult.getValue(),
      spring: springResult.getValue(),
    })

    if (!props?.id) {
      const event = new ProductAddedEvent(product.toDTO())
      product.apply(event)
    }

    return Result.ok<Product>(product)
  }

  update(props: UpdateProductProps): Result<Product> {
    const fields = Object.keys(props)

    for (const field of fields) {
      const guardResult = Validate.againstNullOrUndefined(props[field], field)
      if (guardResult.isFailure) {
        return Result.fail(guardResult.getErrorValue())
      }
    }

    this.props = { ...this.props, ...props }

    const event = new ProductUpdatedEvent({
      code: this.props.code.toValue(),
      ...props,
    })
    this.apply(event)

    return Result.ok<Product>(this)
  }

  incrementAmountOfSales(increment: number): Result<Product> {
    const validateIncrement = Validate.isGreaterThan(increment, 0, 'increment')
    if (validateIncrement.isFailure) {
      return Result.fail(validateIncrement.getErrorValue())
    }

    const prevAmount = this.props.amountOfSales
    this.props.amountOfSales += increment

    const event = new AmountOfSalesIncrementedEvent({
      code: this.props.code.toString(),
      prevAmount,
      increment,
      currentAmount: this.props.amountOfSales,
    })
    this.apply(event)

    return Result.ok<Product>(this)
  }

  toDTO(): ProductPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      code: this.props.code.toString(),
      price: this.props.price.toDTO(),
      spring: this.props.spring.toDTO(),
    }
  }
}
