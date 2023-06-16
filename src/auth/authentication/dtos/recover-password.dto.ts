import { IsInt, IsNotEmpty, Max, Min, Validate } from 'class-validator'
import { Password, RequireEmail } from '@/.shared/utils'

export class StepOneDto {
  @Validate(RequireEmail)
  email: string
}

export class StepTwoDto {
  @Validate(RequireEmail)
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

export class StepThreeDto {
  @Validate(RequireEmail)
  email: string

  @Validate(Password)
  password: string

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
