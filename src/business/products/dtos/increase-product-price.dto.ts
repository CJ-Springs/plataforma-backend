import { ProductType } from '@prisma/client'
import { IsDefined, IsNumber, IsOptional, Min, Validate } from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class IncreaseProductPriceDto {
  @IsDefined({ message: "Debe enviar el campo 'percentage'" })
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2, allowInfinity: false },
    {
      message:
        "El campo 'percentage' debe ser un número con 2 decimales máximo",
    },
  )
  @Min(0.01, { message: "El campo 'percentage' debe ser mayor a 0" })
  percentage: number
}

export class IncreaseBulkProductsPriceDto extends IncreaseProductPriceDto {
  @IsOptional()
  @Validate(RequireValueForEnum, [ProductType])
  type?: ProductType
}
