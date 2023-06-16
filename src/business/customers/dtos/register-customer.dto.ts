import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Validate,
} from 'class-validator'
import { RequireEmail } from '@/.shared/utils'

export class AddressDto {
  @IsOptional()
  @IsString({ message: "El campo 'country' debe ser un string" })
  country: string

  @IsNotEmpty({ message: "Debe enviar el campo 'province'" })
  @IsString({ message: "El campo 'province' debe ser un string" })
  province: string

  @IsNotEmpty({ message: "Debe enviar el campo 'city'" })
  @IsString({ message: "El campo 'city' debe ser un string" })
  city: string

  @IsNotEmpty({ message: "Debe enviar el campo 'locality'" })
  @IsString({ message: "El campo 'locality' debe ser un string" })
  locality: string

  @IsNotEmpty({ message: "Debe enviar el campo 'address'" })
  @IsString({ message: "El campo 'address' debe ser un string" })
  address: string
}

export class RegisterCustomerDto extends AddressDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'name'" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  name: string

  @IsNotEmpty({ message: "Debe enviar el campo 'code'" })
  @IsInt({ message: "El campo 'code' debe ser un número entero" })
  @IsPositive({ message: "El campo 'code' no puede ser un número negativo" })
  code: number

  @Validate(RequireEmail)
  email: string

  @IsNotEmpty({ message: "Debe enviar el campo 'cuil'" })
  @IsString({ message: "El campo 'cuil' debe ser un string" })
  cuil: string

  @IsNotEmpty({ message: "Debe enviar el campo 'phone'" })
  @IsPhoneNumber('AR', {
    message:
      "El campo 'phone' debe cumplir con el formato de un celular argentino (10 números mínimo)",
  })
  phone: string

  @IsNotEmpty({ message: "Debe enviar el campo 'paymentDeadline'" })
  @IsInt({ message: "El campo 'paymentDeadline' debe ser un número entero" })
  @IsPositive({
    message: "El campo 'paymentDeadline' no puede ser un número negativo",
  })
  paymentDeadline: number

  @IsOptional()
  @IsInt({ message: "El campo 'discount' debe ser un número entero" })
  @IsPositive({
    message: "El campo 'discount' no puede ser un número negativo",
  })
  discount?: number
}
