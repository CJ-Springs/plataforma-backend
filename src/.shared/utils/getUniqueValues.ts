/**
 * @description Devuelve un array con valores únicos
 * @param array
 */

export const getUniqueValues = <T extends any[]>(arr: any[]): T =>
  Array.from(new Set(arr)) as T
