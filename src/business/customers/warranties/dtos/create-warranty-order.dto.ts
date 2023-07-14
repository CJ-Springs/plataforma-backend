import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator'

class WarrantyOrderItemDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'productCode'" })
  @IsString({ message: "El campo 'productCode' debe ser un string" })
  productCode: string

  @IsDefined({ message: "Debe enviar el campo 'requested'" })
  @IsInt({ message: "El campo 'requested' debe ser un número entero" })
  @IsPositive({ message: "El campo 'requested' debe ser mayor a 0" })
  requested: number
}

export class CreateWarrantyOrderDto {
  @IsOptional()
  @IsString({ message: "El campo 'observation' debe ser un string" })
  observation?: string

  @IsDefined({ message: "Debe enviar el campo 'items'" })
  @IsArray({ message: "El campo 'items' debe ser un array" })
  @ArrayNotEmpty({ message: "El campo 'items' no puede ser un array vacío" })
  @ValidateNested()
  @Type(() => WarrantyOrderItemDto)
  items: WarrantyOrderItemDto[]
}
