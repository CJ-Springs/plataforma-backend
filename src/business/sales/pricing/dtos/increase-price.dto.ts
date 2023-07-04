import { ProductType } from '@prisma/client'
import { IsDefined, IsNumber, IsOptional, Min, Validate } from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class IncreasePriceDto {
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

export class IncreaseBulkPricesDto extends IncreasePriceDto {
  @IsOptional()
  @Validate(RequireValueForEnum, [ProductType])
  type?: ProductType
}
