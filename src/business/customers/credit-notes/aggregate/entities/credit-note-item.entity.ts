import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type CreditNoteItemProps = {
  productCode: UniqueField
  returned: number
  price: number
}

export type CreditNoteItemPropsDTO = {
  id: string
  productCode: string
  returned: number
  price: number
}

export class CreditNoteItem
  extends Entity<CreditNoteItemProps>
  implements IToDTO<CreditNoteItemPropsDTO>
{
  private constructor(props: CreditNoteItemProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(
    props: Partial<CreditNoteItemPropsDTO>,
  ): Result<CreditNoteItem> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.productCode, argumentName: 'productCode' },
        { argument: props.returned, argumentName: 'returned' },
        { argument: props.price, argumentName: 'price' },
      ]),
      Validate.isGreaterThan(props.returned, 0, 'returned'),
      Validate.isGreaterThan(props.price, 0, 'price'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const creditNoteItem = new CreditNoteItem(
      {
        productCode: new UniqueField(props.productCode),
        returned: props.returned,
        price: props.price,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<CreditNoteItem>(creditNoteItem)
  }

  toDTO(): CreditNoteItemPropsDTO {
    return {
      ...this.props,
      id: this._id.toString(),
      productCode: this.props.productCode.toString(),
    }
  }
}
