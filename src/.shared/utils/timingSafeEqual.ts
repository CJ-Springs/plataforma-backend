import * as crypto from 'crypto'

export const timingSafeEqual = (a: string, b: string): boolean => {
  const first = Buffer.from(a)
  const second = Buffer.from(b)

  return first.length === second.length && crypto.timingSafeEqual(first, second)
}
