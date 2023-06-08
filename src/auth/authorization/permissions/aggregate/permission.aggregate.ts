import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { PermissionCreatedEvent } from '../events/impl/permission-created.event'

export type PermissionProps = {
  id: UniqueEntityID
  name: UniqueField
  description: string
  roles: UniqueField[]
}

export type PermissionPropsDTO = {
  id: string
  name: string
  description: string
  roles: AppRole[]
}

export class Permission extends AggregateRoot {
  private constructor(public props: PermissionProps) {
    super()
  }

  static create(props: Partial<PermissionPropsDTO>): Result<Permission> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.description, argumentName: 'description' },
    ])

    if (guardResult.isFailure) {
      return Result.fail<Permission>(guardResult.getErrorValue())
    }

    const id = new UniqueEntityID(props?.id)
    const name = new UniqueField(props.name)

    const permission = new Permission({
      id,
      name,
      description: props.description,
      roles: props.roles.map((role) => new UniqueField(role)),
    })

    if (!props.id) {
      const event = new PermissionCreatedEvent({
        ...permission.props,
        id: permission.props.id.toString(),
        name: permission.props.name.toString(),
        roles: permission.rolesToDto(),
      })

      permission.apply(event)
    }

    return Result.ok<Permission>(permission)
  }

  toDto(): PermissionPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      name: this.props.name.toString(),
      roles: this.rolesToDto(),
    }
  }

  private rolesToDto(): AppRole[] {
    return this.props.roles.map((role) => role.toString() as AppRole)
  }
}
