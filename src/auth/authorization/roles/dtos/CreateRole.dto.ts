import { AppRole } from '@prisma/client'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateRoleDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'role' para crear un rol" })
  @IsIn([AppRole.ADMIN, AppRole.USER], {
    message: `El rol debe ser uno de los siguientes: ${AppRole.ADMIN} | ${AppRole.USER}`,
  })
  role: AppRole

  @IsOptional()
  @IsString({
    each: true,
    message: "El campo 'permissions' debe ser un array de strings",
  })
  permissions?: string[]
}
