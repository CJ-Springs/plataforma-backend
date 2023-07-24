/**
 * @description Setea la hora UTC con el GMT que sea pasado como parámetro
 * @param gmt @default -3
 */

export const getTimeZone = (gmt = -3): Date => {
  const today = new Date()

  return new Date(today.setHours(today.getHours() + gmt))
}
