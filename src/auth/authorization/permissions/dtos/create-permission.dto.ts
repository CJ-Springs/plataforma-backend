import { AppRole } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class CreatePermissionDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'name' para crear un permiso" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  @MaxLength(55, {
    message: "El campo 'name' no debe exceder los 55 caracteres",
  })
  name: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'description' para crear un permiso",
  })
  @IsString({ message: "El campo 'description' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'description' no debe exceder los 255 caracteres",
  })
  description: string

  @IsOptional()
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @Validate(RequireValueForEnum, [AppRole], { each: true })
  roles?: AppRole[]
}
