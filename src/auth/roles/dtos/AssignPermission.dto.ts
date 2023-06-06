import { AppRole } from '@prisma/client'
import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator'

export class AssignPermissionDto {
  @IsNotEmpty({
    message: "Debe enviar el campo 'permission' para crear un permiso",
  })
  @IsString({ message: "El campo 'permission' debe ser un string" })
  permission: string

  @IsNotEmpty()
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @IsIn([AppRole.ADMIN, AppRole.USER], {
    message: `El rol debe ser uno de los siguientes: ${AppRole.ADMIN} | ${AppRole.USER}`,
    each: true,
  })
  roles: AppRole[]
}
