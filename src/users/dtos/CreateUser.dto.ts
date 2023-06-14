import { AppRole } from '@prisma/client'
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty({
    message: "Debe enviar el campo 'email'",
  })
  @IsEmail(
    {},
    {
      message:
        "El campo 'email' debe cumplir con el formato de un email (example@gmail.com)",
    },
  )
  email: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'firstname'",
  })
  @IsString({
    message: "El campo 'firstname' debe ser un string",
  })
  firstname: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'lastname'",
  })
  @IsString({
    message: "El campo 'lastname' debe ser un string",
  })
  lastname: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'phone'",
  })
  @IsString({
    message: "El campo 'phone' debe ser un string",
  })
  phone: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'document'",
  })
  @IsInt({ message: "El campo 'document' debe ser un número entero" })
  document: number

  @IsOptional()
  @IsIn([AppRole.ADMIN, AppRole.USER], {
    message: `El rol debe ser uno de los siguientes: ${AppRole.ADMIN} | ${AppRole.USER}`,
  })
  role?: AppRole
}
