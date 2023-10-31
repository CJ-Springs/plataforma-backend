import { Currencies } from '@prisma/client'
import { AggregateRoot } from '@nestjs/cqrs'

import { Address, AddressPropsDTO } from './value-objects/address.value-object'
import { CustomerRegisteredEvent } from '../events/impl/customer-registered.event'
import { CustomerUpdatedEvent } from '../events/impl/customer-updated.event'
import { BalanceReducedEvent } from '../events/impl/balance-reduced.event'
import { BalanceIncreasedEvent } from '../events/impl/balance-increased.event'
import { Currency, Email, Money, Result, Validate } from '@/.shared/helpers'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { DeepPartial, IToDTO } from '@/.shared/types'

type CustomerProps = {
  id: UniqueEntityID
  code: UniqueField<number>
  email: Email
  name: string
  phone: string
  cuil?: string
  balance: Money
  paymentDeadline: number
  discount?: number
  address: Address
}

type CustomerPropsDTO = {
  id: string
  code: number
  email: string
  name: string
  phone: string
  cuil?: string
  balance: number
  paymentDeadline: number
  discount?: number
  address: AddressPropsDTO
}

type UpdateCustomerProps = DeepPartial<
  Omit<CustomerPropsDTO, 'id' | 'code' | 'email' | 'balance'>
>

export class Customer
  extends AggregateRoot
  implements IToDTO<CustomerPropsDTO>
{
  private constructor(public props: CustomerProps) {
    super()
  }

  static create(props: DeepPartial<CustomerPropsDTO>): Result<Customer> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.phone, argumentName: 'phone' },
      { argument: props.paymentDeadline, argumentName: 'paymentDeadline' },
      { argument: props.address, argumentName: 'address' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const emailResult = Email.create({ email: props.email })
    if (emailResult.isFailure) {
      return Result.fail(emailResult.getErrorValue())
    }

    const validateBalance = Money.validate(props.balance, 'balance')
    if (validateBalance.isFailure) {
      return Result.fail(validateBalance.getErrorValue())
    }

    const addressResult = Address.create(props.address)
    if (addressResult.isFailure) {
      return Result.fail(addressResult.getErrorValue())
    }

    const customer = new Customer({
      id: new UniqueEntityID(props?.id),
      code: new UniqueField(props.code),
      email: emailResult.getValue(),
      name: props.name,
      phone: props.phone,
      balance: Money.fromString(
        String(props.balance),
        Currency.create(Currencies.ARS),
      ),
      paymentDeadline: props.paymentDeadline,
      cuil: props.cuil,
      discount: props.discount,
      address: addressResult.getValue(),
    })

    if (!props.id) {
      const event = new CustomerRegisteredEvent(customer.toDTO())
      customer.apply(event)
    }

    return Result.ok<Customer>(customer)
  }

  update(props: UpdateCustomerProps): Result<Customer> {
    const { address, ...fieldsToUpdate } = props

    for (const field of Object.keys(fieldsToUpdate)) {
      if (field === 'discount') continue
      if (field === 'cuil') continue

      const guardResult = Validate.againstNullOrUndefined(
        fieldsToUpdate[field],
        field,
      )
      if (guardResult.isFailure) {
        return Result.fail(guardResult.getErrorValue())
      }
    }
    this.props = { ...this.props, ...fieldsToUpdate }

    if (address) {
      const addressResult = Address.create({
        ...this.props.address.toDTO(),
        ...address,
      })
      if (addressResult.isFailure) {
        return Result.fail(addressResult.getErrorValue())
      }

      this.props.address = addressResult.getValue()
    }

    const event = new CustomerUpdatedEvent({
      code: this.props.code.toValue(),
      ...props,
    })
    this.apply(event)

    return Result.ok<Customer>(this)
  }

  reduceBalance(reduction: number): Result<Customer> {
    const validateReduction = Money.validate(reduction, 'reduction', {
      validateIsGreaterThanZero: true,
    })
    if (validateReduction.isFailure) {
      return Result.fail(validateReduction.getErrorValue())
    }

    this.props.balance = this.props.balance.substract(
      Money.fromString(String(reduction), Currency.create(Currencies.ARS)),
    )

    const event = new BalanceReducedEvent({
      code: this.props.code.toValue(),
      reduction,
      balance: this.props.balance.getValue(),
    })
    this.apply(event)

    return Result.ok<Customer>(this)
  }

  increaseBalance(increment: number): Result<Customer> {
    const validateIncrement = Money.validate(increment, 'increment', {
      validateIsGreaterThanZero: true,
    })
    if (validateIncrement.isFailure) {
      return Result.fail(validateIncrement.getErrorValue())
    }

    this.props.balance = this.props.balance.add(
      Money.fromString(String(increment), Currency.create(Currencies.ARS)),
    )

    const event = new BalanceIncreasedEvent({
      code: this.props.code.toValue(),
      increment,
      balance: this.props.balance.getValue(),
    })
    this.apply(event)

    return Result.ok<Customer>(this)
  }

  toDTO(): CustomerPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      balance: this.props.balance.getValue(),
      code: this.props.code.toValue(),
      email: this.props.email.getValue(),
      address: this.props.address.toDTO(),
    }
  }
}
