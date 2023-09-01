import { Currencies, PaymentMethod, PaymentStatus } from '@prisma/client'

import { Entity, UniqueEntityID } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type PaymentProps = {
  paymentMethod: PaymentMethod
  amount: Money
  remaining: Money
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
  remaining: number
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

    if (props.remaining) {
      const validateRemaining = Money.validate(
        props.remaining,
        'paymentRemaining',
        {
          validateIsGreaterOrEqualThanZero: true,
        },
      )
      if (validateRemaining.isFailure) {
        return Result.fail(validateRemaining.getErrorValue())
      }
    }

    const payment = new Payment(
      {
        paymentMethod: props.paymentMethod,
        amount: Money.fromString(
          String(props.amount),
          Currency.create(Currencies.ARS),
        ),
        remaining: Money.fromString(
          String(props.remaining ?? 0),
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

  /**
   * @description añade el monto enviado al sobrante del pago, restándolo del monto
   * total del mismo.
   * @example
   * amount = 1000
   * remaining = 0
   * // se llama el método addToRemaining(200)
   * amount = 800
   * remaining = 200
   * @param addition
   */
  addToRemaining(addition: number): Result<Payment> {
    const validateAddition = Money.validate(addition, 'addition', {
      validateInRange: { min: 0, max: this.props.amount.getValue() },
    })
    if (validateAddition.isFailure) {
      return Result.fail(validateAddition.getErrorValue())
    }

    this.props.remaining = this.props.remaining.add(
      Money.fromString(String(addition), this.props.remaining.getCurrency()),
    )

    this.props.amount = this.props.amount.substract(this.props.remaining)

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
    if (this.props.paymentMethod === PaymentMethod.SALDO_A_FAVOR) {
      return Result.fail(
        'No es posible cancelar un pago realizado con el saldo a favor del cliente',
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
      remaining: this.props.remaining.getValue(),
      depositId: this.props.depositId?.toString(),
    }
  }
}
