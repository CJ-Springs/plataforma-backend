import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PartialType } from '@nestjs/swagger'

export class AddressDto {
  @IsOptional()
  @IsString({ message: "El campo 'country' debe ser un string" })
  country?: string

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

export class PartialAddressDto extends PartialType(AddressDto) {
  @IsOptional()
  province?: string

  @IsOptional()
  locality?: string

  @IsOptional()
  city?: string

  @IsOptional()
  address?: string
}
