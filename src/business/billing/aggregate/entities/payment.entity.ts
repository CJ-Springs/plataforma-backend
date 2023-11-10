import { Currencies, PaymentMethod, PaymentStatus } from '@prisma/client'

import { Entity, UniqueEntityID } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'

type PaymentProps = {
  paymentMethod: PaymentMethod
  totalAmount: Money
  netAmount: Money
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
  totalAmount: number
  netAmount: number
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

  get id(): string {
    return this._id.toString()
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

    const validateTotalAmount = Money.validate(
      props.totalAmount,
      'payment-total-amount',
      {
        validateIsGreaterThanZero: true,
      },
    )
    if (validateTotalAmount.isFailure) {
      return Result.fail(validateTotalAmount.getErrorValue())
    }

    const remaining = props.remaining ?? 0
    const netAmount = props.netAmount ?? props.totalAmount - remaining

    if (netAmount + remaining !== props.totalAmount) {
      return Result.fail(
        'La suma del monto neto y el sobrante no coincide con el monto total del pago',
      )
    }

    if (props.paymentMethod === PaymentMethod.SALDO_A_FAVOR && remaining > 0) {
      return Result.fail(
        'Los pagos realizados con saldo a favor no pueden tener sobrante',
      )
    }

    const payment = new Payment(
      {
        paymentMethod: props.paymentMethod,
        totalAmount: Money.fromString(
          String(props.totalAmount),
          Currency.create(Currencies.ARS),
        ),
        netAmount: Money.fromString(
          String(netAmount),
          Currency.create(Currencies.ARS),
        ),
        remaining: Money.fromString(
          String(remaining),
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

  addToRemaining(addition: number): Result<Payment> {
    const validateAddition = Money.validate(addition, 'addition', {
      validateInRange: {
        min: 0,
        max: this.props.netAmount.getValue(),
      },
    })
    if (validateAddition.isFailure) {
      return Result.fail(validateAddition.getErrorValue())
    }

    const additionToRemaining = Money.fromString(
      String(addition),
      this.props.totalAmount.getCurrency(),
    )

    this.props.remaining = this.props.remaining.add(additionToRemaining)
    this.props.netAmount = this.props.netAmount.substract(additionToRemaining)

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

    this.props.status = PaymentStatus.ANULADO
    this.props.canceledBy = canceledBy

    return Result.ok<Payment>(this)
  }

  reduceAmount(reduction: number): Result<Payment> {
    if (this.props.status === PaymentStatus.ANULADO) {
      return Result.fail('No se puede reducir el monto de un pago anulado')
    }
    if (this.props.remaining.getValue() > 0) {
      return Result.fail('No se puede reducir el monto de un pago con sobrante')
    }

    const validateReduction = Money.validate(reduction, 'paymentReduction', {
      validateInRange: { min: 0, max: this.props.totalAmount.getValue() },
    })
    if (validateReduction.isFailure) {
      return Result.fail(validateReduction.getErrorValue())
    }

    this.props.totalAmount = this.props.totalAmount.substract(
      Money.fromString(String(reduction), this.props.totalAmount.getCurrency()),
    )

    // Podemos hacer esto porque solo se reduce el monto de pagos SIN sobrante
    this.props.netAmount = this.props.totalAmount

    return Result.ok<Payment>(this)
  }

  toDTO(): PaymentPropsDTO {
    return {
      id: this._id.toString(),
      ...this.props,
      totalAmount: this.props.totalAmount.getValue(),
      netAmount: this.props.netAmount.getValue(),
      remaining: this.props.remaining.getValue(),
      depositId: this.props.depositId?.toString(),
    }
  }
}
