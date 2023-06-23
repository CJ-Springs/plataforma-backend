import { ProductType, AllowedCurrency } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

class ProductSpringDto {
  @IsOptional()
  @IsBoolean({
    message: "El campo 'associateToAnExistingSpring' debe ser un booleano",
  })
  associateToAnExistingSpring: boolean

  @ValidateIf((o) => o.associateToAnExistingSpring)
  @IsNotEmpty({ message: "Debe enviar el campo 'code'" })
  @IsString({ message: "El campo 'code' debe ser un string" })
  code?: string

  @ValidateIf((o) => !o.associateToAnExistingSpring)
  @IsDefined({ message: "Debe enviar el campo 'canAssociate'" })
  @IsBoolean({ message: "El campo 'canAssociate' debe ser un booleano" })
  canAssociate?: boolean

  @ValidateIf((o) => !o.associateToAnExistingSpring)
  @IsDefined({ message: "Debe enviar el campo 'minQuantity'" })
  @IsInt({ message: "El campo 'minQuantity' debe ser un número entero" })
  @Min(0, { message: "El campo 'minQuantity' debe ser mayor o igual a 0" })
  minQuantity?: number

  @ValidateIf((o) => !o.associateToAnExistingSpring)
  @IsDefined({ message: "Debe enviar el campo 'quantityOnHand'" })
  @IsInt({ message: "El campo 'quantityOnHand' debe ser un número entero" })
  @Min(0, { message: "El campo 'quantityOnHand' debe ser mayor o igual a 0" })
  quantityOnHand?: number
}

export class AddProductDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'code'" })
  @IsString({ message: "El campo 'code' debe ser un string" })
  code: string

  @IsNotEmpty({ message: "Debe enviar el campo 'brand'" })
  @IsString({ message: "El campo 'brand' debe ser un string" })
  brand: string

  @IsNotEmpty({ message: "Debe enviar el campo 'model'" })
  @IsString({ message: "El campo 'model' debe ser un string" })
  model: string

  @IsOptional()
  @IsString({ message: "El campo 'description' debe ser un string" })
  description?: string

  @IsNotEmpty({ message: "Debe enviar el campo 'type'" })
  @IsEnum(ProductType, {
    message: `El campo type debe ser uno de los siguientes: ${Object.values(
      ProductType,
    ).join(', ')}`,
  })
  type: ProductType

  @IsDefined({ message: "Debe enviar el campo 'isGnc'" })
  @IsBoolean({ message: "El campo 'isGnc' debe ser un booleano" })
  isGnc: boolean

  @IsDefined({ message: "Debe enviar el campo 'price'" })
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2, allowInfinity: false },
    { message: "El campo 'price' debe ser un número con 2 decimales máximo" },
  )
  @Min(0.01, { message: "El campo 'price' debe ser mayor a 0" })
  price: number

  @IsOptional()
  @IsEnum(AllowedCurrency, {
    message: `El campo currency debe ser uno de los siguientes: ${Object.values(
      AllowedCurrency,
    ).join(', ')}`,
  })
  currency: AllowedCurrency

  @IsDefined({ message: "Debe enviar el campo 'spring" })
  @Type(() => ProductSpringDto)
  @ValidateNested({
    message: "El campo 'spring' debe ser un objeto",
  })
  spring: ProductSpringDto
}
