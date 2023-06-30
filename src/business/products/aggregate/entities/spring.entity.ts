import { Stock } from '../value-objects/stock.value-object'
import { Entity, UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { DeepPartial } from '@/.shared/types'

type SpringProps = {
  code: UniqueField
  canAssociate: boolean
  stock: Stock
}

export type SpringPropsDTO = {
  id: string
  code: string
  canAssociate: boolean
  stock: Stock['props']
}

export class Spring extends Entity<SpringProps> {
  private constructor(props: SpringProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(props: DeepPartial<SpringPropsDTO>): Result<Spring> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.canAssociate, argumentName: 'canAssociate' },
      { argument: props.stock, argumentName: 'stock' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const stockResult = Stock.create(props.stock)
    if (stockResult.isFailure) {
      return Result.fail(stockResult.getErrorValue())
    }

    const spring = new Spring(
      {
        code: new UniqueField(props.code),
        canAssociate: props.canAssociate,
        stock: stockResult.getValue(),
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<Spring>(spring)
  }

  toDTO(): SpringPropsDTO {
    return {
      id: this._id.toString(),
      ...this.props,
      code: this.props.code.toString(),
      stock: this.props.stock.getValue(),
    }
  }
}
