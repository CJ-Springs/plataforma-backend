import { ValueObject } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

type StockProps = {
  quantityOnHand: number
}

export class Stock extends ValueObject<StockProps> {
  private constructor(props: StockProps) {
    super(props)
  }

  static create(props: Partial<StockProps>): Result<Stock> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefined(props.quantityOnHand, 'quantityOnHand'),
      Validate.isGreaterOrEqualThan(props.quantityOnHand, 0, 'quantityOnHand'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const stock = new Stock({
      quantityOnHand: props.quantityOnHand,
    })

    return Result.ok<Stock>(stock)
  }

  getValue(): StockProps {
    return this.props
  }
}
