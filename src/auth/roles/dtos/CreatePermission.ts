import { AppRole } from '@prisma/client'
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

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
  @IsIn([AppRole.ADMIN, AppRole.USER], {
    message: `El rol debe ser uno de los siguientes: ${AppRole.ADMIN} | ${AppRole.USER}`,
    each: true,
  })
  roles?: AppRole[]
}
