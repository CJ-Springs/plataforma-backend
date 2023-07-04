import { ProductType } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Price, PricePropsDTO } from './value-objects/price.value-object'
import { Spring, SpringPropsDTO } from './entities/spring.entity'
import { ProductAddedEvent } from '../events/impl/product-added.event'
import { DeepPartial, IAggregateToDTO } from '@/.shared/types'
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

export class Product
  extends AggregateRoot
  implements IAggregateToDTO<ProductPropsDTO>
{
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
