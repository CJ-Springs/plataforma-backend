import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { PermissionAssigned } from '../events/impl/permission-assigned.event'
import { RoleCreatedEvent } from '../events/impl/role-created.event'
import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { IAggregateToDTO } from '@/.shared/types'

export type RoleProps = {
  id: UniqueEntityID
  code: UniqueField<AppRole>
  name: string
  permissions: UniqueField[]
}

export type RolePropsDTO = {
  id: string
  code: AppRole
  name: string
  permissions: string[]
}

export class Role
  extends AggregateRoot
  implements IAggregateToDTO<RolePropsDTO>
{
  private constructor(public props: RoleProps) {
    super()
  }

  static create(props: Partial<RolePropsDTO>): Result<Role> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.code, argumentName: 'code' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.permissions, argumentName: 'permissions' },
    ])
    if (guardResult.isFailure) {
      return Result.fail(guardResult.getErrorValue())
    }

    const role = new Role({
      id: new UniqueEntityID(props?.id),
      code: new UniqueField(props.code),
      name: props.name,
      permissions: props.permissions?.map(
        (permission) => new UniqueField(permission),
      ),
    })

    if (!props.id) {
      const event = new RoleCreatedEvent(role.toDTO())
      role.apply(event)
    }

    return Result.ok<Role>(role)
  }

  addPermission({ permission }: { permission: string }): Result<Role> {
    const permissionIsAlreadyAdded = this.hasPermission(permission)
    if (permissionIsAlreadyAdded) {
      return Result.fail(
        `El permiso ${permission} ya forma parte del rol ${this.props.code.toValue()}`,
      )
    }

    this.props.permissions.push(new UniqueField(permission))

    const event = new PermissionAssigned({
      permission,
      role: this.props.code.toValue(),
    })
    this.apply(event)

    return Result.ok<Role>(this)
  }

  hasPermission(permissionName: string): boolean {
    const permissionNameAsIdentifier = new UniqueField(permissionName)

    const hasPermission = this.props.permissions.some((permission) =>
      permission.equals(permissionNameAsIdentifier),
    )

    return hasPermission
  }

  toDTO(): RolePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      code: this.props.code.toValue(),
      permissions: this.props.permissions.map((permission) =>
        permission.toString(),
      ),
    }
  }
}
