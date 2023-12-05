import { IsDefined, IsInt, Min } from 'class-validator'

export class StockAdjustmentDto {
  @IsDefined({ message: "Debe enviar el campo 'adjustment'" })
  @IsInt({ message: "El campo 'adjustment' debe ser un número entero" })
  @Min(0, { message: "El campo 'adjustment' debe ser mayor o igual a 0" })
  adjustment: number
}
