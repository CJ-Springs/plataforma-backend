const CONSTANT_CONVENTION_REGEXP = /^[A-Z_$0-9][A-Z_$0-9]*$/

export const formatConstantValue = (constant: string): string => {
  if (!CONSTANT_CONVENTION_REGEXP.test(constant)) {
    console.log(`${constant} doesnt follow the rules of a constant value`)
    return constant
  }

  return constant.split('_').join(' ').toLowerCase()
}
