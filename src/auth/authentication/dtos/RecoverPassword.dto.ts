import { PasswordValidation } from '@/.shared/utils'
import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator'

export class StepOneDto {
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

export class StepTwoDto {
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

  @IsNotEmpty({
    message: "Debe enviar el campo 'code'",
  })
  @IsInt({
    message: "El campo 'code' debe ser un número entero",
  })
  @Min(100000, { message: "El campo 'code' debe tener un mínimo de 6 dígitos" })
  @Max(999999, { message: "El campo 'code' debe tener un máximo de 6 dígitos" })
  code: number
}

export class StepThreeDto extends PasswordValidation {
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

  @IsNotEmpty({
    message: "Debe enviar el campo 'code'",
  })
  @IsInt({
    message: "El campo 'code' debe ser un número entero",
  })
  @Min(100000, { message: "El campo 'code' debe tener un mínimo de 6 dígitos" })
  @Max(999999, { message: "El campo 'code' debe tener un máximo de 6 dígitos" })
  code: number
}
