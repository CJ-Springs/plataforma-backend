import { IsNotEmpty, IsString, Validate } from 'class-validator'
import { RequireEmail } from '@/.shared/utils'

export class LoginDto {
  @Validate(RequireEmail)
  email: string

  @IsNotEmpty({ message: "Debe enviar el campo 'password'" })
  @IsString({ message: "El campo 'password' debe ser un string" })
  password: string
}
