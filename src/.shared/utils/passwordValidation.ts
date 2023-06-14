import { IsNotEmpty, Matches } from 'class-validator'

// Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:

export const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9]).{8,}$/

export class PasswordValidation {
  @IsNotEmpty({
    message: "Debe enviar el campo 'password'",
  })
  @Matches(passwordRegExp, {
    message:
      "El campo 'password' debe contar con, al menos, 8 caracteres, un número, una mayúscula y una minúscula",
  })
  password: string
}
