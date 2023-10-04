import { AppRole } from '@prisma/client'
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator'
import { RequireEmail, RequireValueForEnum } from '@/.shared/utils'

export class CreateUserDto {
  @Validate(RequireEmail)
  email: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'firstname'",
  })
  @IsString({
    message: "El campo 'firstname' debe ser un string",
  })
  @MinLength(3, {
    message: "El campo 'firstname' debe contar con, al menos, 3 letras",
  })
  @MaxLength(55, {
    message: "El campo 'firstname' no debe exceder los 55 caracteres",
  })
  firstname: string

  @IsNotEmpty({
    message: "Debe enviar el campo 'lastname'",
  })
  @IsString({
    message: "El campo 'lastname' debe ser un string",
  })
  @MinLength(3, {
    message: "El campo 'lastname' debe contar con, al menos, 3 letras",
  })
  @MaxLength(55, {
    message: "El campo 'firstname' no debe exceder los 55 caracteres",
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
  @Min(1_000_000, {
    message: 'El número de documento debe ser mayor a 1 millón',
  })
  document: number

  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @ArrayNotEmpty({ message: "El campo 'roles' no puede ser un array vacío" })
  @Validate(RequireValueForEnum, [AppRole], { each: true })
  roles: AppRole[]
}
