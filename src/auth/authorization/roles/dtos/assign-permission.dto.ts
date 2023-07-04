import { AppRole } from '@prisma/client'
import { IsArray, IsNotEmpty, IsString, Validate } from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class AssignPermissionDto {
  @IsNotEmpty({
    message: "Debe enviar el campo 'permission' para crear un permiso",
  })
  @IsString({ message: "El campo 'permission' debe ser un string" })
  permission: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'roles'",
  })
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @Validate(RequireValueForEnum, [AppRole], { each: true })
  roles: AppRole[]
}
