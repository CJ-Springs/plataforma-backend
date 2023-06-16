import { AggregateRoot } from '@nestjs/cqrs'

import { Email, Result, Validate } from '@/.shared/helpers'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Address } from './value-objects/address.value-object'

type CustomerProps = {
  id: UniqueEntityID
  code: UniqueField<number>
  email: Email
  name: string
  phone: string
  cuil: string
  owe: number
  discount?: number
  address: Address
}

type CustomerPropsDTO = {
  id: string
  code: number
  email: string
  name: string
  phone: string
  cuil: string
  owe: number
  discount?: number
  address: Address['props']
}

export class Customer extends AggregateRoot {
  private constructor(public props: CustomerProps) {
    super()
  }

  static create(props: CustomerPropsDTO): Result<Customer> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.phone, argumentName: 'phone' },
      { argument: props.cuil, argumentName: 'cuil' },
      { argument: props.owe, argumentName: 'owe' },
      { argument: props.address, argumentName: 'address' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const emailResult = Email.create({ email: props.email })
    if (emailResult.isFailure) {
      return Result.fail(emailResult.getErrorValue())
    }

    const { address } = props
    const addressResult = Address.create({
      province: address.province,
      city: address.city,
      locality: address.locality,
      address: address.address,
    })
    if (addressResult.isFailure) {
      return Result.fail(emailResult.getErrorValue())
    }

    const customer = new Customer({
      id: new UniqueEntityID(props.id),
      code: new UniqueField(props.code),
      email: emailResult.getValue(),
      name: props.name,
      phone: props.phone,
      owe: props.owe,
      cuil: props.cuil,
      discount: props?.discount,
      address: addressResult.getValue(),
    })

    if (!props.id) {
      //   const event = new UserCreatedEvent({
      //     ...user.toDTO(),
      //     password: user.props.password.getValue(),
      //   })
      //   user.apply(event)
    }

    return Result.ok<Customer>(customer)
  }

  toDTO(): CustomerPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      code: this.props.code.toValue(),
      email: this.props.email.getValue(),
      address: this.props.address.getValue(),
    }
  }
}
