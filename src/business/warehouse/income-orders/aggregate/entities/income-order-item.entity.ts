import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type IncomeOrderItemProps = {
  entered: number
  productCode: UniqueField
}

export type IncomeOrderItemPropsDTO = {
  id: string
  productCode: string
  entered: number
}

export class IncomeOrderItem
  extends Entity<IncomeOrderItemProps>
  implements IToDTO<IncomeOrderItemPropsDTO>
{
  private constructor(props: IncomeOrderItemProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(
    props: Partial<IncomeOrderItemPropsDTO>,
  ): Result<IncomeOrderItem> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.productCode, argumentName: 'productCode' },
        { argument: props.entered, argumentName: 'entered' },
      ]),
      Validate.isGreaterThan(props.entered, 0, 'entered'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const incomeOrderItem = new IncomeOrderItem(
      {
        productCode: new UniqueField(props.productCode),
        entered: props.entered,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<IncomeOrderItem>(incomeOrderItem)
  }

  toDTO(): IncomeOrderItemPropsDTO {
    return {
      ...this.props,
      id: this._id.toString(),
      productCode: this.props.productCode.toString(),
    }
  }
}
