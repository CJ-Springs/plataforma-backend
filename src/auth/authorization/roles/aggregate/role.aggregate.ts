import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { UniqueEntityID, UniqueField } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { RoleCreatedEvent } from '../events/impl/role-created.event'
import { PermissionAssigned } from '../events/impl/permission-assigned.event'

export type RoleProps = {
  id: UniqueEntityID
  role: AppRole
  permissions: UniqueField[]
}

export type RolePropsDTO = {
  id: string
  role: AppRole
  permissions: string[]
}

export class Role extends AggregateRoot {
  private constructor(public props: RoleProps) {
    super()
  }

  static create(props: Partial<RolePropsDTO>): Result<Role> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.role, argumentName: 'role' },
      { argument: props.permissions, argumentName: 'permissions' },
    ])

    if (guardResult.isFailure) {
      return Result.fail<Role>(guardResult.getErrorValue())
    }

    const roleId = new UniqueEntityID(props?.id)

    const role = new Role({
      id: roleId,
      role: props.role,
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

  addPermission({ name }: { name: string }): Result<Role> {
    const nameAsIdentifier = new UniqueField(name)

    const permissionIsAlreadyAdded = this.props.permissions.some((permission) =>
      permission.equals(nameAsIdentifier),
    )

    if (permissionIsAlreadyAdded) {
      return Result.fail<Role>(
        `El permiso ${name} ya forma parte del rol ${this.props.role}`,
      )
    }

    this.props.permissions.push(nameAsIdentifier)

    const event = new PermissionAssigned({
      permission: name,
      role: this.props.role,
    })

    this.apply(event)

    return Result.ok<Role>(this)
  }

  toDTO(): RolePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      permissions: this.props.permissions.map((permission) =>
        permission.toString(),
      ),
    }
  }
}
