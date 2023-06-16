import { AppRole } from '@prisma/client'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Validate,
} from 'class-validator'
import { RequireEmail } from '@/.shared/utils'

export class CreateUserDto {
  @Validate(RequireEmail)
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
  @IsPhoneNumber('AR', {
    message:
      "El campo 'phone' debe cumplir con el formato de un celular argentino (10 números mínimo)",
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
