import { Currencies, PaymentMethod, PaymentStatus } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { DepositMadeEvent } from '../events/impl/deposit-made.event'
import { DepositRemainingUpdatedEvent } from '../events/impl/deposit-remaining-updated.event'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Currency, Money, Result, Validate } from '@/.shared/helpers'
import { IToDTO } from '@/.shared/types'
import { DepositCanceledEvent } from '../events/impl/deposit-canceled.event'

type DepositProps = {
  id: UniqueEntityID
  paymentMethod: PaymentMethod
  amount: Money
  remaining: Money
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
  metadata?: Record<string, any>
  customerCode: UniqueField<number>
}

export type DepositPropsDTO = {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  remaining: number
  createdBy: string
  canceledBy?: string
  status: PaymentStatus
  metadata?: Record<string, any>
  customerCode: number
}

export class Deposit extends AggregateRoot implements IToDTO<DepositPropsDTO> {
  private constructor(public props: DepositProps) {
    super()
  }

  static create(props: Partial<DepositPropsDTO>): Result<Deposit> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.paymentMethod, argumentName: 'paymentMethod' },
      { argument: props.createdBy, argumentName: 'createdBy' },
      { argument: props.status, argumentName: 'status' },
      { argument: props.customerCode, argumentName: 'customerCode' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const validateAmount = Money.validate(props.amount, 'depositAmount', {
      validateIsGreaterThanZero: true,
    })
    if (validateAmount.isFailure) {
      return Result.fail(validateAmount.getErrorValue())
    }

    if (props.remaining) {
      const validateRemaining = Money.validate(
        props.remaining,
        'depositRemaining',
        {
          validateInRange: { min: 0, max: props.amount },
        },
      )
      if (validateRemaining.isFailure) {
        return Result.fail(validateRemaining.getErrorValue())
      }
    }

    const deposit = new Deposit({
      id: new UniqueEntityID(props.id),
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
      canceledBy: props.canceledBy,
      status: props.status,
      metadata: props.metadata,
      customerCode: new UniqueField<number>(props.customerCode),
    })

    if (!props.id) {
      const event = new DepositMadeEvent(deposit.toDTO())
      deposit.apply(event)
    }

    return Result.ok<Deposit>(deposit)
  }

  cancel(canceledBy: string): Result<Deposit> {
    const validate = Validate.againstNullOrUndefined(canceledBy, 'canceledBy')
    if (validate.isFailure) {
      return Result.fail(validate.getErrorValue())
    }

    if (this.props.status === PaymentStatus.ANULADO) {
      return Result.fail('El depósito ya ha sido anulado')
    }

    this.props.status = PaymentStatus.ANULADO
    this.props.canceledBy = canceledBy

    const event = new DepositCanceledEvent({
      depositId: this.props.id.toString(),
      customerCode: this.props.customerCode.toValue(),
      canceledBy: this.props.canceledBy,
      amount: this.props.amount.getValue(),
      remaining: this.props.remaining.getValue(),
    })
    this.apply(event)

    return Result.ok<Deposit>(this)
  }

  addToRemaining(addition: number): Result<Deposit> {
    const prevRemaining = this.props.remaining.getValue()

    const validateAddition = Money.validate(addition, 'addition', {
      validateInRange: {
        min: 0,
        max: this.props.amount.getValue() - prevRemaining,
      },
    })
    if (validateAddition.isFailure) {
      return Result.fail(validateAddition.getErrorValue())
    }

    this.props.remaining = this.props.remaining.add(
      Money.fromString(String(addition), this.props.remaining.getCurrency()),
    )

    const event = new DepositRemainingUpdatedEvent({
      id: this.props.id.toString(),
      prevRemaining,
      remaining: this.props.remaining.getValue(),
    })
    this.apply(event)

    return Result.ok<Deposit>(this)
  }

  toDTO(): DepositPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      amount: this.props.amount.getValue(),
      remaining: this.props.remaining.getValue(),
      customerCode: this.props.customerCode.toValue(),
    }
  }
}
