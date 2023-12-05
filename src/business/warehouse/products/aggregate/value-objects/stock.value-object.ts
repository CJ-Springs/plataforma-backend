import { ValueObject } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type StockProps = {
  quantityOnHand: number
  minQuantity: number
}

export class Stock extends ValueObject<StockProps> {
  private constructor(props: StockProps) {
    super(props)
  }

  static create(props: Partial<StockProps>): Result<Stock> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.quantityOnHand, argumentName: 'quantityOnHand' },
        { argument: props.minQuantity, argumentName: 'minQuantity' },
      ]),
      Validate.isGreaterOrEqualThan(props.quantityOnHand, 0, 'quantityOnHand'),
      Validate.isGreaterOrEqualThan(props.minQuantity, 0, 'minQuantity'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const stock = new Stock({
      quantityOnHand: props.quantityOnHand,
      minQuantity: props.minQuantity,
    })

    return Result.ok<Stock>(stock)
  }

  getValue(): StockProps {
    return this.props
  }
}
