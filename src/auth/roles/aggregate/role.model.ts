import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import {
  Permission,
  PermissionPropsDTO,
} from '../permissions/aggregate/permission.model'

export type RoleProps = {
  id: UniqueEntityID
  role: AppRole
  permissions: Permission[]
}

export type RolePropsDTO = {
  id: string
  role: AppRole
  permissions: PermissionPropsDTO[]
}

export class Role extends AggregateRoot {
  constructor(public props: RoleProps) {
    super()
  }

  static create(props: Partial<RoleProps>): Result<Role> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.role, argumentName: 'role' },
    ])

    if (guardResult.isFailure) {
      return Result.fail<Role>(guardResult.getErrorValue())
    }

    const roleId = new UniqueEntityID(null)

    const role = new Role({
      id: roleId,
      role: props.role,
      permissions: props.permissions ?? [],
    })

    return Result.ok<Role>(role)
  }

  toDTO(): RolePropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
      permissions: this.props.permissions.map((permission) =>
        permission.toDto(),
      ),
    }
  }
}
