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
