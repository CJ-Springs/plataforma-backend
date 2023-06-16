import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isEmail,
  isNotEmpty,
  matches,
} from 'class-validator'

// Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:

export const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9]).{8,}$/

@ValidatorConstraint({ name: 'password', async: false })
export class Password implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    return isNotEmpty(password) && matches(password, passwordRegExp)
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} es requerido y debe contar con, al menos, 8 caracteres, un número, una mayúscula y una minúscula`
  }
}

@ValidatorConstraint({ name: 'require-email', async: false })
export class RequireEmail implements ValidatorConstraintInterface {
  validate(email: string): boolean {
    return isNotEmpty(email) && isEmail(email)
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} es requerido y debe cumplir con el formato de un email (example@gmail.com)`
  }
}
