import { PaymentMethod } from '@prisma/client'

import { Entity, UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type PaymentProps = {
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  metadata?: Record<string, any>
}

export type PaymentPropsDTO = {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  metadata?: Record<string, any>
}

export class Payment
  extends Entity<PaymentProps>
  implements IToDTO<PaymentPropsDTO>
{
  private constructor(props: PaymentProps, id?: UniqueEntityID) {
    super(props, id)
  }

  static create(props: Partial<PaymentPropsDTO>): Result<Payment> {
    const guardResult = Validate.combine([
      Validate.againstNullOrUndefinedBulk([
        { argument: props.paymentMethod, argumentName: 'paymentMethod' },
        { argument: props.amount, argumentName: 'amount' },
        { argument: props.createdBy, argumentName: 'createdBy' },
      ]),
      Validate.isGreaterThan(props.amount, 0, 'amount'),
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const payment = new Payment(
      {
        paymentMethod: props.paymentMethod,
        amount: props.amount,
        createdBy: props.createdBy,
        metadata: props?.metadata,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<Payment>(payment)
  }

  toDTO(): PaymentPropsDTO {
    return {
      id: this._id.toString(),
      ...this.props,
    }
  }
}
