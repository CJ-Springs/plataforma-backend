import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

import { RequireEmail } from '@/.shared/utils'
import { AddressDto } from './address.dto'

export class RegisterCustomerDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'name'" })
  @IsString({ message: "El campo 'name' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'name' no debe exceder los 255 caracteres",
  })
  name: string

  @IsNotEmpty({ message: "Debe enviar el campo 'code'" })
  @IsInt({ message: "El campo 'code' debe ser un número entero" })
  @IsPositive({ message: "El campo 'code' no puede ser un número negativo" })
  code: number

  @Validate(RequireEmail)
  email: string

  @IsNotEmpty({ message: "Debe enviar el campo 'cuil'" })
  @IsString({ message: "El campo 'cuil' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'cuil' no debe exceder los 255 caracteres",
  })
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
  @Min(1, { message: "El valor mínimo para el campo 'discount' es 1" })
  @Max(99, { message: "El valor máximo para el campo 'discount' es 99" })
  discount?: number

  @IsDefined({ message: "Debe enviar el campo 'address'" })
  @IsNotEmptyObject(
    { nullable: false },
    { message: "El campo 'address' no puede ser un objeto vacío" },
  )
  @Type(() => AddressDto)
  @ValidateNested({
    message:
      'El campo address debe contener las siguiente propiedades: country (opcional), province, city, locality, address',
  })
  address: AddressDto
}
