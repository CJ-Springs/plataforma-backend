import { AppRole } from '@prisma/client'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class CreateRoleDto {
  @Validate(RequireValueForEnum, [AppRole])
  code: AppRole

  @IsNotEmpty({ message: "Debe enviar el campo 'name'" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  @MaxLength(55, {
    message: "El campo 'name' no debe exceder los 55 caracteres",
  })
  name: string

  @IsOptional()
  @IsArray({ message: "El campo 'permissions' debe ser un array" })
  @IsString({
    each: true,
    message:
      "El campo 'permissions' debe ser un array que contenga los nombres de los permisos que se quieren agregar al rol",
  })
  permissions?: string[]

  @IsOptional()
  @IsBoolean({
    message: "El campo 'allPermissions' debe ser un boolean",
  })
  allPermissions?: boolean
}
