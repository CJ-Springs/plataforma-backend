import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { Profile } from './value-objects/profile.value-object'
import { Password } from './value-objects/password.value-object'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Email, Result, Validate } from '@/.shared/helpers'
import { UserCreatedEvent } from '../events/impl/user-created.event'
import { UserStatusChangedEvent } from '../events/impl/user-status-changed'
import { UserPasswordChangedEvent } from '../events/impl/user-password-changed'

export type UserProps = {
  id: UniqueEntityID
  email: Email
  password: Password
  isSuspended: boolean
  deleted: boolean
  profile: Profile
  role: UniqueField
}

export type UserPropsDTO = {
  id: string
  email: string
  password: string
  isSuspended: boolean
  deleted: boolean
  profile: Profile['props']
  role: AppRole
}

export class User extends AggregateRoot {
  private constructor(public props: UserProps) {
    super()
  }

  static create(props: Partial<UserPropsDTO>): Result<User> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.isSuspended, argumentName: 'isSuspended' },
      { argument: props.deleted, argumentName: 'deleted' },
      { argument: props.role, argumentName: 'role' },
      { argument: props.profile, argumentName: 'profile' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const emailResult = Email.create({ email: props.email })
    if (emailResult.isFailure) {
      return Result.fail(emailResult.getErrorValue())
    }

    const passwordResult = Password.create({ password: props.password })
    if (passwordResult.isFailure) {
      return Result.fail(passwordResult.getErrorValue())
    }

    const { profile } = props
    const profileResult = Profile.create({
      firstname: profile.firstname,
      lastname: profile.lastname,
      phone: profile.phone,
      document: profile.document,
    })
    if (profileResult.isFailure) {
      return Result.fail(profileResult.getErrorValue())
    }

    const user = new User({
      id: new UniqueEntityID(props?.id),
      isSuspended: props.isSuspended,
      deleted: props.deleted,
      role: new UniqueField(props.role),
      email: emailResult.getValue(),
      password: passwordResult.getValue(),
      profile: profileResult.getValue(),
    })

    if (!props.id) {
      const event = new UserCreatedEvent({
        ...user.toDTO(),
        password: user.props.password.getValue(),
      })
      user.apply(event)
    }

    return Result.ok<User>(user)
  }

  changeStatus(): void {
    this.props.isSuspended = !this.props.isSuspended

    const event = new UserStatusChangedEvent({
      id: this.props.id.toString(),
      isSuspended: this.props.isSuspended,
    })
    this.apply(event)
  }

  changePassword(newPassword: string): Result<User> {
    const passwordResult = Password.create({ password: newPassword })
    if (passwordResult.isFailure) {
      return Result.fail(passwordResult.getErrorValue())
    }

    this.props.password = passwordResult.getValue()

    const event = new UserPasswordChangedEvent({
      id: this.props.id.toString(),
      password: this.props.password.getValue(),
    })
    this.apply(event)

    return Result.ok(this)
  }

  toDTO(): Omit<UserPropsDTO, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...props } = this.props

    return {
      ...props,
      id: props.id.toString(),
      email: props.email.getValue(),
      profile: props.profile.getValue(),
      role: props.role.toString() as AppRole,
    }
  }
}
