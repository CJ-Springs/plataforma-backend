import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type WarrantyOrderItemProps = {
  productCode: UniqueField
  requested: number
}

export type WarrantyOrderItemPropsDTO = {
  id: string
  productCode: string
  requested: number
}

export class WarrantyOrderItem
  extends Entity<WarrantyOrderItemProps>
  implements IToDTO<WarrantyOrderItemPropsDTO>
{
  private constructor(props: WarrantyOrderItemProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(
    props: Partial<WarrantyOrderItemPropsDTO>,
  ): Result<WarrantyOrderItem> {
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

    const warrantyOrderItem = new WarrantyOrderItem(
      {
        productCode: new UniqueField(props.productCode),
        requested: props.requested,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<WarrantyOrderItem>(warrantyOrderItem)
  }

  toDTO(): WarrantyOrderItemPropsDTO {
    return {
      ...this.props,
      id: this._id.toString(),
      productCode: this.props.productCode.toString(),
    }
  }
}
