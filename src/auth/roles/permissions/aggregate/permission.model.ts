import { UniqueEntityID } from '@/.shared/domain'

export type PermissionPropsDTO = {
  id: string
  name: string
  description: string
}

export class Permission {
  constructor(
    public id: UniqueEntityID,
    public name: string,
    public description: string,
  ) {}

  toDto(): PermissionPropsDTO {
    return {
      id: this.id.toString(),
      name: this.name,
      description: this.description,
    }
  }
}
