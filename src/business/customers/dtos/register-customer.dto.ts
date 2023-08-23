import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

import { RequireEmail } from '@/.shared/utils'
import { AddressDto } from './address.dto'

export class RegisterCustomerDto {
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
