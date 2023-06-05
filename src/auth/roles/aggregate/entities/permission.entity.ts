import { UniqueEntityID } from '@/.shared/domain'
import { Result, Validate } from '@/.shared/helpers'

export type PermissionProps = {
  id: UniqueEntityID
  name: string
  description: string
}

export type PermissionPropsDTO = {
  id: string
  name: string
  description: string
}

export class Permission {
  private constructor(public props: PermissionProps) {}

  static create(props: Partial<PermissionPropsDTO>): Result<Permission> {
    const guardResult = Validate.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.description, argumentName: 'description' },
    ])

    if (guardResult.isFailure) {
      return Result.fail<Permission>(guardResult.getErrorValue())
    }

    const permissionId = new UniqueEntityID(props?.id)

    const permission = new Permission({
      id: permissionId,
      name: props.name,
      description: props.description,
    })

    return Result.ok<Permission>(permission)
  }

  toDto(): PermissionPropsDTO {
    return {
      ...this.props,
      id: this.props.id.toString(),
    }
  }
}
