import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

class CreditNoteItemDto {
  @IsNotEmpty({ message: "Debe enviar el campo 'productCode'" })
  @IsString({ message: "El campo 'productCode' debe ser un string" })
  productCode: string

  @IsDefined({ message: "Debe enviar el campo 'returned'" })
  @IsInt({ message: "El campo 'returned' debe ser un número entero" })
  @IsPositive({ message: "El campo 'returned' debe ser mayor a 0" })
  returned: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    {
      message: "El campo 'price' debe ser un número con máximo 2 decimales",
    },
  )
  @IsPositive({ message: "El campo 'price' debe ser mayor a 0" })
  price?: number
}

export class MakeCreditNoteDto {
  @IsOptional()
  @IsString({ message: "El campo 'observation' debe ser un string" })
  @MaxLength(1000, {
    message: "El campo 'observation' no debe exceder los 1000 caracteres",
  })
  observation?: string

  @IsDefined({ message: "Debe enviar el campo 'items'" })
  @IsArray({ message: "El campo 'items' debe ser un array" })
  @ArrayNotEmpty({ message: "El campo 'items' no puede ser un array vacío" })
  @ValidateNested()
  @Type(() => CreditNoteItemDto)
  items: CreditNoteItemDto[]
}
