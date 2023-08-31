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
  depositId?: UniqueEntityID
  metadata?: Record<string, any>
}

export type PaymentPropsDTO = {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
  depositId?: string
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

    const validateAmount = Money.validate(props.amount, 'paymentAmount', {
      validateIsGreaterThanZero: true,
    })
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
        depositId: props.depositId && new UniqueEntityID(props.depositId),
        metadata: props?.metadata,
      },
      new UniqueEntityID(props?.id),
    )

    return Result.ok<Payment>(payment)
  }

  reduceAmount(reduction: number): Result<Payment> {
    const validateReduction = Money.validate(reduction, 'reduction', {
      validateInRange: { min: 0, max: this.props.amount.getValue() },
    })
    if (validateReduction.isFailure) {
      return Result.fail(validateReduction.getErrorValue())
    }

    this.props.amount = this.props.amount.substract(
      Money.fromString(String(reduction), Currency.create(Currencies.ARS)),
    )

    return Result.ok<Payment>(this)
  }

  cancel(canceledBy: string): Result<Payment> {
    const validate = Validate.againstNullOrUndefined(canceledBy, 'canceledBy')
    if (validate.isFailure) {
      return Result.fail(validate.getErrorValue())
    }
    if (this.props.status === PaymentStatus.ANULADO) {
      return Result.fail('El pago ya ha sido anulado')
    }
    if (this.props.depositId) {
      return Result.fail(
        'El pago fue realizado a partir de un depósito, por lo que no se puede cancelar de manera individual',
      )
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
      depositId: this.props.depositId?.toString(),
    }
  }
}
