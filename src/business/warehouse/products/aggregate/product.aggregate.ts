import { Currencies, ProductPosition, ProductType } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Spring, SpringPropsDTO } from './entities/spring.entity'
import { ProductAddedEvent } from '../events/impl/product-added.event'
import { ProductUpdatedEvent } from '../events/impl/product-updated.event'
import { DeepPartial, IToDTO } from '@/.shared/types'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'

type ProductProps = {
  id: UniqueEntityID
  code: UniqueField
  type: ProductType
  position: ProductPosition
  brand: string
  model: string
  description?: string
  isGnc: boolean
  amountOfSales: number
  price: Money
  spring: Spring
}

type ProductPropsDTO = {
  id: string
  code: string
  type: ProductType
  position: ProductPosition
  brand: string
  model: string
  description?: string
  isGnc: boolean
  amountOfSales: number
  price: { price: number; currency: Currencies }
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
      { argument: props.position, argumentName: 'position' },
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

    const springResult = Spring.create(props.spring)
    if (springResult.isFailure) {
      return Result.fail(springResult.getErrorValue())
    }

    const validatePrice = Money.validate(props.price.price, 'price', {
      validateIsGreaterThanZero: true,
    })
    if (validatePrice.isFailure) {
      return Result.fail(validatePrice.getErrorValue())
    }

    const product = new Product({
      id: new UniqueEntityID(props?.id),
      code: new UniqueField(props.code),
      type: props.type,
      position: props.position,
      brand: props.brand,
      model: props.model,
      isGnc: props.isGnc,
      amountOfSales: props.amountOfSales,
      description: props?.description,
      price: Money.fromString(
        String(props.price.price),
        Currency.create(props.price.currency ?? Currencies.ARS),
      ),
      spring: springResult.getValue(),
    })

    if (!props.id) {
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

  toDTO(): ProductPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      code: this.props.code.toString(),
      price: {
        price: this.props.price.getValue(),
        currency: this.props.price.getCurrency().getValue(),
      },
      spring: this.props.spring.toDTO(),
    }
  }
}
