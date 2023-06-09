export const getUniqueValues = <T extends any[]>(arr: any[]): T =>
  Array.from(new Set(arr)) as T
