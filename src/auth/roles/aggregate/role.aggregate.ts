import { AggregateRoot } from '@nestjs/cqrs'
import { AppRole } from '@prisma/client'

import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'
import { Permission, PermissionPropsDTO } from './entities/permission.entity'

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
  private constructor(public props: RoleProps) {
    super()
  }

  static create(props: Partial<RolePropsDTO>): Result<Role> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.role, argumentName: 'role' },
    ])

    if (guardResult.isFailure) {
      return Result.fail<Role>(guardResult.getErrorValue())
    }

    const roleId = new UniqueEntityID(props?.id)

    const role = new Role({
      id: roleId,
      role: props.role,
      permissions:
        props.permissions?.map((permission) =>
          Permission.create(permission).getValue(),
        ) ?? [],
    })

    return Result.ok<Role>(role)
  }

  addPermission({ id, name, description }: PermissionPropsDTO): Result<Role> {
    const existPermission = this.props.permissions.find(
      (permission) => permission.props.name === name,
    )

    if (existPermission) {
      return Result.fail<Role>(`El permiso ${name} ya forma parte del rol`)
    }

    const permissionOrError = Permission.create({
      id,
      name,
      description,
    })

    if (permissionOrError.isFailure) {
      return Result.fail<Role>(permissionOrError.getErrorValue())
    }

    const permission = permissionOrError.getValue()

    this.props.permissions.push(permission)

    return Result.ok<Role>(this)
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
