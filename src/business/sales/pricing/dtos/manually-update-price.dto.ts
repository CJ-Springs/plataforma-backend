import { IsDefined, IsNumber, Min } from 'class-validator'

export class ManuallyUpdatePriceDto {
  @IsDefined({ message: "Debe enviar el campo 'update'" })
  @IsNumber(
    { allowNaN: false, maxDecimalPlaces: 2, allowInfinity: false },
    { message: "El campo 'update' debe ser un número con 2 decimales máximo" },
  )
  @Min(0.01, { message: "El campo 'update' debe ser mayor a 0" })
  update: number
}
