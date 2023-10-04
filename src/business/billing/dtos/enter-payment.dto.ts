import { PaymentMethod } from '@prisma/client'
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
} from 'class-validator'

import { RequireValueForEnum } from '@/.shared/utils'

export class EnterPaymentDto {
  @IsNotEmpty({
    message: "Debe enviar el campo 'paymentMethod'",
  })
  @Validate(RequireValueForEnum, [PaymentMethod])
  paymentMethod: PaymentMethod

  @IsDefined({ message: "Debe enviar el campo 'amount'" })
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 3, allowInfinity: false },
    { message: "El campo 'amount' debe ser un número con 3 decimales máximo" },
  )
  @Min(0.01, { message: "El campo 'amount' debe ser mayor a 0" })
  amount: number

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MERCADO_PAGO)
  @IsNotEmpty({ message: "Debe enviar el campo 'mpUser'" })
  @IsString({ message: "El campo 'mpUser' debe ser un string" })
  @MaxLength(255, {
    message: "El campo 'mpUser' no debe exceder los 255 caracteres",
  })
  mpUser?: string

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MERCADO_PAGO)
  @IsDefined({ message: "Debe enviar el campo 'voucherNumber'" })
  @IsInt({ message: "El campo 'voucherNumber' debe ser un número entero" })
  voucherNumber?: number

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.TRANSFERENCIA)
  @IsDefined({ message: "Debe enviar el campo 'operationNumber'" })
  @IsInt({ message: "El campo 'operationNumber' debe ser un número entero" })
  operationNumber?: number

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.TRANSFERENCIA)
  @IsDefined({ message: "Debe enviar el campo 'cvu'" })
  @IsInt({ message: "El campo 'cvu' debe ser un número entero" })
  cvu?: number

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CHEQUE)
  @IsDefined({ message: "Debe enviar el campo 'code'" })
  @IsInt({ message: "El campo 'code' debe ser un número entero" })
  code?: number

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CHEQUE)
  @IsDefined({ message: "Debe enviar el campo 'paymentDate'" })
  @IsDateString(
    {},
    { message: "El campo 'paymentDate' debe ser una fecha (YYYY-MM-DD)" },
  )
  paymentDate?: Date

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CHEQUE)
  @IsDefined({ message: "Debe enviar el campo 'thirdParty'" })
  @IsBoolean({ message: "El campo 'thirdParty' debe ser un boolean" })
  thirdParty?: boolean
}
