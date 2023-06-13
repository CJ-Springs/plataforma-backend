/**
 * @description Genera un código numérico aleatorio de la longitud especificada
 * @param number @default 6
 */

export const getNumericCode = (length: number = 6): number => {
  const max = parseInt('9'.repeat(length))
  const min = parseInt(1 + '0'.repeat(length - 1))

  return Math.floor(Math.random() * (max - min)) + min
}
