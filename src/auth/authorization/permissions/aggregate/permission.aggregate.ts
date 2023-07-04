import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { PermissionCreatedEvent } from '../events/impl/permission-created.event'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IAggregateToDTO } from '@/.shared/types'

export type PermissionProps = {
  id: UniqueEntityID
  name: UniqueField
  description: string
  roles: UniqueField<AppRole>[]
}

export type PermissionPropsDTO = {
  id: string
  name: string
  description: string
  roles: AppRole[]
}

export class Permission
  extends AggregateRoot
  implements IAggregateToDTO<PermissionPropsDTO>
{
  private constructor(public props: PermissionProps) {
    super()
  }

  static create(props: Partial<PermissionPropsDTO>): Result<Permission> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.roles, argumentName: 'roles' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const permission = new Permission({
      id: new UniqueEntityID(props?.id),
      name: new UniqueField(props.name),
      description: props.description,
      roles: props.roles.map((role) => new UniqueField(role)),
    })

    if (!props?.id) {
      const event = new PermissionCreatedEvent(permission.toDTO())
      permission.apply(event)
    }

    return Result.ok<Permission>(permission)
  }

  toDTO(): PermissionPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      name: this.props.name.toString(),
      roles: this.rolesToDTO(),
    }
  }

  private rolesToDTO(): AppRole[] {
    return this.props.roles.map((role) => role.toString() as AppRole)
  }
}
