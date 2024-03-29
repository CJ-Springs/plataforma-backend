export * from './IRepository'

export type Types = 'string' | 'number' | 'boolean'

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type JwtPayload = {
  id: string
  firstname: string
  lastname: string
}

type SuccessStatusCode = 200 | 201

export type StandardResponse<T = any> = {
  success: true
  status: SuccessStatusCode
  message: string
  data?: T
}

export interface IToDTO<T extends Record<string, any>> {
  toDTO(): T
}

export enum MovementReason {
  STOCK_ADJUSTMENT = 'Ajuste de stock',
  INCOME_ORDER = 'Orden de ingreso',
  WARRANTY_ORDER = 'Orden de garantía',
  SALE_ORDER = 'Orden de venta',
  CREDIT_NOTE = 'Nota de crédito',
}
