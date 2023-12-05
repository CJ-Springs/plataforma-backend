import { Type } from 'class-transformer'
import {
  IsDefined,
  IsNotEmpty,
  IsInt,
  IsPositive,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  IsString,
} from 'class-validator'

class IncomeOrderItemDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'productCode'" })
  @IsString({ message: "El campo 'productCode' debe ser un string" })
  productCode: string

  @IsDefined({ message: "Debe enviar el campo 'entered'" })
  @IsInt({ message: "El campo 'entered' debe ser un número entero" })
  @IsPositive({ message: "El campo 'entered' debe ser mayor a 0" })
  entered: number
}

export class PlaceIncomeOrderDto {
  @IsDefined({ message: "Debe enviar el campo 'items'" })
  @IsArray({ message: "El campo 'items' debe ser un array" })
  @ArrayNotEmpty({ message: "El campo 'items' no puede ser un array vacío" })
  @ValidateNested()
  @Type(() => IncomeOrderItemDto)
  items: IncomeOrderItemDto[]
}
