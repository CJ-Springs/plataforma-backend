export * from './IRepository'

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

export interface IAggregateToDTO<T extends Record<string, any>> {
  toDTO(): T
}
