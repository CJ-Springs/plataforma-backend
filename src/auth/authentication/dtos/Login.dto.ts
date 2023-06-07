import { IsEmail, IsNotEmpty } from 'class-validator'

import { PasswordValidation } from '@/.shared/utils/passwordValidation'

export class LoginDto extends PasswordValidation {
  @IsNotEmpty({
    message: "Debe enviar el campo 'email'",
  })
  @IsEmail(
    {},
    {
      message:
        "El campo 'email' debe cumplir con el formato de un email (example@gmail.com)",
    },
  )
  email: string
}
