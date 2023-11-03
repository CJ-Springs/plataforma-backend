import { TechnicalSheetType } from '@prisma/client'
import { OmitType, PartialType } from '@nestjs/swagger'
import {
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  Validate,
} from 'class-validator'

import { RequireValueForEnum, formatConstantValue } from '@/.shared/utils'
import { ShouldNotExistsIf } from '@/.shared/decorators'

export class AttachTechnicalSheetDto {
  @Validate(RequireValueForEnum, [TechnicalSheetType])
  type: TechnicalSheetType

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    { message: 'El peso debe ser un número (máximo 3 decimales)' },
  )
  @IsPositive({
    message: 'El peso no puede ser un número menor o igual a 0',
  })
  weight?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'La altura debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message: 'La altura no puede ser un número menor o igual a 0',
  })
  height?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'El grosor de alambre debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message: 'El grosor de alambre no puede ser un número menor o igual a 0',
  })
  wireThickness?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'El largo de barra debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message: 'El largo de barra no puede ser un número menor o igual a 0',
  })
  barLength?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'La cantidad de vueltas debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message: 'La cantidad de vueltas no puede ser un número menor o igual a 0',
  })
  amountOfLaps?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'La luz entre bases I debe ser un número (máximo 3 decimales)',
    },
  )
  @Min(0, {
    message: 'La luz entre bases I debe ser mayor o igual a 0',
  })
  lightBetweenBases?: number

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'El interior (núcleo) debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message: 'El interior (núcleo) no puede ser un número menor o igual a 0',
  })
  innerCore?: number

  @ShouldNotExistsIf((o) => o.type === TechnicalSheetType.TRABA_TRABA, {
    message: `La luz entre bases II no corresponde a un espiral de tipo ${formatConstantValue(
      TechnicalSheetType.TRABA_TRABA,
    )}`,
  })
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: 'La luz entre bases II debe ser un número (máximo 3 decimales)',
    },
  )
  @Min(0, {
    message: 'La luz entre bases II debe ser mayor o igual a 0',
  })
  lightBetweenBasesTwo?: number

  @ShouldNotExistsIf((o) => o.type === TechnicalSheetType.TRABA_TRABA, {
    message: `El interior entre bases I no corresponde a un espiral de tipo ${formatConstantValue(
      TechnicalSheetType.TRABA_TRABA,
    )}`,
  })
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        'El interior entre bases I debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message:
      'El interior entre bases I no puede ser un número menor o igual a 0',
  })
  innerBases?: number

  @ShouldNotExistsIf(
    (o) =>
      o.type === TechnicalSheetType.TRABA_TRABA ||
      o.type === TechnicalSheetType.TRABA_OJAL,
    {
      message: `El interior entre bases II no corresponde a un espiral de tipo ${formatConstantValue(
        TechnicalSheetType.TRABA_TRABA,
      )} o ${formatConstantValue(TechnicalSheetType.TRABA_OJAL)}`,
    },
  )
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        'El interior entre bases II debe ser un número (máximo 3 decimales)',
    },
  )
  @IsPositive({
    message:
      'El interior entre bases II no puede ser un número menor o igual a 0',
  })
  innerBasesTwo?: number
}

export class EditTechnicalSheetDto extends PartialType(
  OmitType(AttachTechnicalSheetDto, ['type']),
) {
  @Validate(RequireValueForEnum, [TechnicalSheetType])
  type: TechnicalSheetType
}
