import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { Profile } from './value-objects/profile.value-object'
import { Password } from './value-objects/password.value-object'
import { UserCreatedEvent } from '../events/impl/user-created.event'
import { UserPasswordChangedEvent } from '../events/impl/user-password-changed'
import { UserRolesUpdatedEvent } from '../events/impl/user-roles-updated.event'
import { UserSuspendedEvent } from '../events/impl/user-suspended.event'
import { UserActivatedEvent } from '../events/impl/user-activated.event'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Email, Result, Validate } from '@/.shared/helpers'
import { DeepPartial, IToDTO } from '@/.shared/types'

export type UserProps = {
  id: UniqueEntityID
  email: Email
  password: Password
  isSuspended: boolean
  deleted: boolean
  profile: Profile
  roles: UniqueField<AppRole>[]
}

export type UserPropsDTO = {
  id: string
  email: string
  password: string
  isSuspended: boolean
  deleted: boolean
  profile: Profile['props']
  roles: AppRole[]
}

export type UserPropsDTOWithoutPassword = Omit<UserPropsDTO, 'password'>

export class User
  extends AggregateRoot
  implements IToDTO<UserPropsDTOWithoutPassword>
{
  private constructor(public props: UserProps) {
    super()
  }

  static create(props: DeepPartial<UserPropsDTO>): Result<User> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.isSuspended, argumentName: 'isSuspended' },
      { argument: props.deleted, argumentName: 'deleted' },
      { argument: props.roles, argumentName: 'roles' },
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

    const profileResult = Profile.create(props.profile)
    if (profileResult.isFailure) {
      return Result.fail(profileResult.getErrorValue())
    }

    const user = new User({
      id: new UniqueEntityID(props?.id),
      isSuspended: props.isSuspended,
      deleted: props.deleted,
      roles: props.roles.map((rol) => new UniqueField(rol)),
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

  activate(): Result<User> {
    if (!this.props.isSuspended) {
      return Result.fail('El usuario ya se encuentra activo')
    }

    this.props.isSuspended = false

    const event = new UserActivatedEvent({
      userId: this.props.id.toString(),
    })
    this.apply(event)

    return Result.ok(this)
  }

  suspend(): Result<User> {
    if (this.hasRole(AppRole.SUPER_ADMIN)) {
      return Result.fail(
        `No se puede suspender a un usuario ${AppRole.SUPER_ADMIN}`,
      )
    }
    if (this.props.isSuspended) {
      return Result.fail('El usuario ya se encuentra suspendido')
    }

    this.props.isSuspended = true

    const event = new UserSuspendedEvent({
      userId: this.props.id.toString(),
    })
    this.apply(event)

    return Result.ok(this)
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

  updateRoles(roles: AppRole[]): Result<User> {
    if (this.hasRole(AppRole.SUPER_ADMIN)) {
      return Result.fail(
        `No se puede actualizar los roles de un usuario ${AppRole.SUPER_ADMIN}`,
      )
    }

    const removedRoles = this.props.roles
      .filter((role) => !roles.includes(role.toValue()))
      .map((role) => role.toValue())
    const newRoles = roles.filter((role) => !this.hasRole(role))

    this.props.roles = roles.map((role) => new UniqueField(role))

    const event = new UserRolesUpdatedEvent({
      userId: this.props.id.toString(),
      removedRoles,
      newRoles,
      roles: this.props.roles.map((role) => role.toValue()),
    })
    this.apply(event)

    return Result.ok<User>(this)
  }

  private hasRole(role: AppRole): boolean {
    return this.props.roles.some((_role) => _role.equals(new UniqueField(role)))
  }

  toDTO(): UserPropsDTOWithoutPassword {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...props } = this.props

    return {
      ...props,
      id: props.id.toString(),
      email: props.email.getValue(),
      profile: props.profile.getValue(),
      roles: props.roles.map((role) => role.toValue()),
    }
  }
}
