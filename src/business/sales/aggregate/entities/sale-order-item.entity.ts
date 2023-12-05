import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'
import { Currencies } from '@prisma/client'

type SaleOrderItemProps = {
  productCode: UniqueField
  requested: number
  price: Money
  discount?: number
  salePrice: Money
}

export type SaleOrderItemPropsDTO = {
  id: string
  productCode: string
  requested: number
  price: number
  discount?: number
  salePrice: number
}

export class SaleOrderItem
  extends Entity<SaleOrderItemProps>
  implements IToDTO<SaleOrderItemPropsDTO>
{
  private constructor(props: SaleOrderItemProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(props: Partial<SaleOrderItemPropsDTO>): Result<SaleOrderItem> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.productCode, argumentName: 'productCode' },
        { argument: props.requested, argumentName: 'requested' },
      ]),
      Validate.isGreaterThan(props.requested, 0, 'requested'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const validatePrice = Money.validate(props.price, 'item-price', {
      validateIsGreaterThanZero: true,
    })
    if (validatePrice.isFailure) {
      return Result.fail(validatePrice.getErrorValue())
    }

    const price = Money.fromString(
      String(props.price),
      Currency.create(Currencies.ARS),
    )

    const saleOrderItem = new SaleOrderItem(
      {
        productCode: new UniqueField(props.productCode),
        requested: props.requested,
        price,
        salePrice: price,
        discount: null,
      },
      new UniqueEntityID(props?.id),
    )

    if (props.discount) {
      const discountAppliedOrError = saleOrderItem.applyDiscount(props.discount)

      if (discountAppliedOrError.isFailure) {
        return Result.fail(discountAppliedOrError.getErrorValue())
      }
    }

    return Result.ok<SaleOrderItem>(saleOrderItem)
  }

  applyDiscount(discount: number): Result<SaleOrderItem> {
    const validateDicount = Validate.inRange(discount, 1, 99, 'item-discount')
    if (validateDicount.isFailure) {
      return Result.fail(validateDicount.getErrorValue())
    }

    this.props.discount = discount
    this.props.salePrice = this.props.price.reduceByPercentage(discount)

    return Result.ok<SaleOrderItem>(this)
  }

  toDTO(): SaleOrderItemPropsDTO {
    return {
      ...this.props,
      id: this._id.toString(),
      productCode: this.props.productCode.toString(),
      price: this.props.price.getValue(),
      salePrice: this.props.salePrice.getValue(),
    }
  }
}
