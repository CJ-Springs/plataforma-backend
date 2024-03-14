import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { PartialType } from '@nestjs/swagger'

export class AddressDto {
  @IsOptional()
  @IsString({ message: "El campo 'country' debe ser un string" })
  @MaxLength(55, {
    message: "El campo 'country' no debe exceder los 55 caracteres",
  })
  country?: string

  @IsNotEmpty({ message: "Debe enviar el campo 'province'" })
  @IsString({ message: "El campo 'province' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'province' no debe exceder los 255 caracteres",
  })
  province: string

  @IsNotEmpty({ message: "Debe enviar el campo 'city'" })
  @IsString({ message: "El campo 'city' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'city' no debe exceder los 255 caracteres",
  })
  city: string

  @IsOptional()
  @IsString({ message: "El campo 'locality' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'locality' no debe exceder los 255 caracteres",
  })
  locality?: string

  @IsNotEmpty({ message: "Debe enviar el campo 'address'" })
  @IsString({ message: "El campo 'address' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'address' no debe exceder los 255 caracteres",
  })
  address: string
}

export class PartialAddressDto extends PartialType(AddressDto) {
  @IsOptional()
  province?: string

  @IsOptional()
  city?: string

  @IsOptional()
  address?: string
}
