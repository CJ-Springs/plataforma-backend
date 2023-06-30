import { AppRole } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class CreateRoleDto {
  @Validate(RequireValueForEnum, [AppRole])
  code: AppRole

  @IsNotEmpty({ message: "Debe enviar el campo 'name'" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  name: string

  @IsOptional()
  @IsArray({ message: "El campo 'permissions' debe ser un array" })
  @IsString({
    each: true,
    message:
      "El campo 'permissions' debe ser un array que contenga los nombres de los permisos que se quieren agregar al rol",
  })
  permissions?: string[]
}
