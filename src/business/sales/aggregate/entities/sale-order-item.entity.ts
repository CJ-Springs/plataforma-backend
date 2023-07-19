import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type SaleOrderItemProps = {
  productCode: UniqueField
  requested: number
  price: number
  discount?: number
  salePrice: number
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
        { argument: props.price, argumentName: 'price' },
      ]),
      Validate.isGreaterThan(props.requested, 0, 'requested'),
      Validate.isGreaterThan(props.price, 0, 'price'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const saleOrderItem = new SaleOrderItem(
      {
        productCode: new UniqueField(props.productCode),
        requested: props.requested,
        price: props.price,
        salePrice: props.price,
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
    const validateDicount = Validate.isGreaterThan(discount, 0, 'discount')
    if (validateDicount.isFailure) {
      return Result.fail(validateDicount.getErrorValue())
    }

    this.props.discount = discount

    const reduction = this.props.price * (discount / 100)
    this.props.salePrice = Math.round(this.props.price - reduction)

    return Result.ok<SaleOrderItem>(this)
  }

  toDTO(): SaleOrderItemPropsDTO {
    return {
      ...this.props,
      id: this._id.toString(),
      productCode: this.props.productCode.toString(),
    }
  }
}
