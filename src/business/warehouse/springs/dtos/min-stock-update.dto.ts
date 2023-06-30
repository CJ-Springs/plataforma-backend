import { IsDefined, IsInt, Min } from 'class-validator'

export class MinStockUpdateDto {
  @IsDefined({ message: "Debe enviar el campo 'update'" })
  @IsInt({ message: "El campo 'update' debe ser un número entero" })
  @Min(0, { message: "El campo 'update' debe ser mayor o igual a 0" })
  update: number
}
