import { PaymentMethod, PaymentStatus } from '@prisma/client'

import { Entity, UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type PaymentProps = {
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
  metadata?: Record<string, any>
}

export type PaymentPropsDTO = {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
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
        { argument: props.status, argumentName: 'status' },
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
        canceledBy: props?.canceledBy,
        status: props.status,
        metadata: props?.metadata,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<Payment>(payment)
  }

  reduceAmount(reduction: number): Result<Payment> {
    const validateReduction = Validate.inRange(
      reduction,
      0,
      this.props.amount,
      'reduction',
    )
    if (validateReduction.isFailure) {
      return Result.fail(validateReduction.getErrorValue())
    }

    this.props.amount -= reduction
    return Result.ok<Payment>(this)
  }

  toDTO(): PaymentPropsDTO {
    return {
      id: this._id.toString(),
      ...this.props,
    }
  }
}
