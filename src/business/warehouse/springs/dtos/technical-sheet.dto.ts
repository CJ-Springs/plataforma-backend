import { TechnicalSheetType } from '@prisma/client'
import { OmitType, PartialType } from '@nestjs/swagger'
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Validate,
  ValidateIf,
} from 'class-validator'

import { RequireValueForEnum } from '@/.shared/utils'
import { ShouldNotExistsIf } from '@/.shared/decorators'

export class AttachTechnicalSheetDto {
  @Validate(RequireValueForEnum, [TechnicalSheetType])
  type: TechnicalSheetType

  @IsNotEmpty({ message: "Debe enviar el campo 'weight'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    { message: "El campo 'weight' debe ser un número (máximo 3 decimales)" },
  )
  @IsPositive({
    message: "El campo 'weight' no puede ser un número negativo",
  })
  weight: number

  @IsNotEmpty({ message: "Debe enviar el campo 'height'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    { message: "El campo 'height' debe ser un número (máximo 3 decimales)" },
  )
  @IsPositive({
    message: "El campo 'height' no puede ser un número negativo",
  })
  height: number

  @IsNotEmpty({ message: "Debe enviar el campo 'wireThickness'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        "El campo 'wireThickness' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'wireThickness' no puede ser un número negativo",
  })
  wireThickness: number

  @IsNotEmpty({ message: "Debe enviar el campo 'amountOfLaps'" })
  @IsInt({
    message: "El campo 'amountOfLaps' debe ser un número entero",
  })
  @IsPositive({
    message: "El campo 'amountOfLaps' no puede ser un número negativo",
  })
  amountOfLaps: number

  @IsNotEmpty({ message: "Debe enviar el campo 'lightBetweenBases'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        "El campo 'lightBetweenBases' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'lightBetweenBases' no puede ser un número negativo",
  })
  lightBetweenBases: number

  @IsNotEmpty({ message: "Debe enviar el campo 'innerCore'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: "El campo 'innerCore' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'innerCore' no puede ser un número negativo",
  })
  innerCore: number

  @ValidateIf(
    (o) =>
      o.type === TechnicalSheetType.TRABA_OJAL ||
      o.type === TechnicalSheetType.OJAL_OJAL,
  )
  @IsNotEmpty({ message: "Debe enviar el campo 'lightBetweenBasesTwo'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        "El campo 'lightBetweenBasesTwo' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'lightBetweenBasesTwo' no puede ser un número negativo",
  })
  lightBetweenBasesTwo?: number

  @ValidateIf(
    (o) =>
      o.type === TechnicalSheetType.TRABA_OJAL ||
      o.type === TechnicalSheetType.OJAL_OJAL,
  )
  @IsNotEmpty({ message: "Debe enviar el campo 'innerBases'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message: "El campo 'innerBases' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'innerBases' no puede ser un número negativo",
  })
  innerBases?: number

  @ValidateIf((o) => o.type === TechnicalSheetType.OJAL_OJAL)
  @IsNotEmpty({ message: "Debe enviar el campo 'innerBasesTwo'" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 3 },
    {
      message:
        "El campo 'innerBasesTwo' debe ser un número (máximo 3 decimales)",
    },
  )
  @IsPositive({
    message: "El campo 'innerBasesTwo' no puede ser un número negativo",
  })
  innerBasesTwo?: number
}

export class EditTechnicalSheetDto extends PartialType(
  OmitType(AttachTechnicalSheetDto, ['type']),
) {
  @Validate(RequireValueForEnum, [TechnicalSheetType])
  type: TechnicalSheetType

  @IsOptional()
  weight?: number

  @IsOptional()
  height?: number

  @IsOptional()
  wireThickness?: number

  @IsOptional()
  amountOfLaps?: number

  @IsOptional()
  lightBetweenBases?: number

  @IsOptional()
  innerCore?: number

  @ShouldNotExistsIf((o) => o.type === TechnicalSheetType.TRABA_TRABA, {
    message: `El campo lightBetweenBasesTwo no debe existir si el tipo del espiral es ${TechnicalSheetType.TRABA_TRABA}`,
  })
  @IsOptional()
  lightBetweenBasesTwo?: number

  @ShouldNotExistsIf((o) => o.type === TechnicalSheetType.TRABA_TRABA, {
    message: `El campo innerBases no debe existir si el tipo del espiral es ${TechnicalSheetType.TRABA_TRABA}`,
  })
  @IsOptional()
  innerBases?: number

  @ShouldNotExistsIf(
    (o) =>
      o.type === TechnicalSheetType.TRABA_TRABA ||
      o.type === TechnicalSheetType.TRABA_OJAL,
    {
      message: `El campo innerBasesTwo no debe existir si el tipo del espiral es ${TechnicalSheetType.TRABA_TRABA} o ${TechnicalSheetType.TRABA_OJAL}`,
    },
  )
  @IsOptional()
  innerBasesTwo?: number
}
