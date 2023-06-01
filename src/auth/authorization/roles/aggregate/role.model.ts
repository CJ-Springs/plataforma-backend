import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

export type RoleProps = {
  id: UniqueEntityID
  role: AppRole
  permissions: string[]
}

export type RolePropsDTO = {
  id: string
  role: AppRole
  permissions: string[]
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
      id: this.props.id.toString(),
      role: this.props.role,
      permissions: this.props.permissions,
    }
  }
}
