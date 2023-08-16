import { Currencies, PaymentMethod, PaymentStatus } from '@prisma/client'

import { Entity, UniqueEntityID } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type PaymentProps = {
  paymentMethod: PaymentMethod
  amount: Money
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
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.paymentMethod, argumentName: 'paymentMethod' },
      { argument: props.amount, argumentName: 'amount' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.status, argumentName: 'status' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const validateAmount = Money.validate(props.amount, 'paymentAmount')
    if (validateAmount.isFailure) {
      return Result.fail(validateAmount.getErrorValue())
    }

    const payment = new Payment(
      {
        paymentMethod: props.paymentMethod,
        amount: Money.fromString(
          String(props.amount),
          Currency.create(Currencies.ARS),
        ),
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
    const validateReduction = Money.validate(reduction, 'reduction')
    if (validateReduction.isFailure) {
      return Result.fail(validateReduction.getErrorValue())
    }

    const substractionResult = this.props.amount.substract(
      Money.fromString(String(reduction), Currency.create(Currencies.ARS)),
    )
    if (substractionResult.isFailure) {
      return Result.fail(substractionResult.getErrorValue())
    }

    this.props.amount = substractionResult.getValue()

    return Result.ok<Payment>(this)
  }

  cancelPayment(canceledBy: string): Result<Payment> {
    const validate = Validate.againstNullOrUndefined(canceledBy, 'canceledBy')
    if (validate.isFailure) {
      return Result.fail(validate.getErrorValue())
    }
    if (this.props.status === PaymentStatus.ANULADO) {
      return Result.fail('El pago ya ha sido anulado')
    }

    this.props.status = PaymentStatus.ANULADO
    this.props.canceledBy = canceledBy

    return Result.ok<Payment>(this)
  }

  toDTO(): PaymentPropsDTO {
    return {
      id: this._id.toString(),
      ...this.props,
      amount: this.props.amount.getValue(),
    }
  }
}
