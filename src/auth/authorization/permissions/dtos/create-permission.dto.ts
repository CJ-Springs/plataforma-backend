import { AppRole } from '@prisma/client'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class CreatePermissionDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'name' para crear un permiso" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  name: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'description' para crear un permiso",
  })
  @IsString({ message: "El campo 'description' debe ser un string" })
  description: string

  @IsOptional()
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @Validate(RequireValueForEnum, [AppRole], { each: true })
  roles?: AppRole[]
}
