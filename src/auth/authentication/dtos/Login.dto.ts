import { Validate } from 'class-validator'
import { Password, RequireEmail } from '@/.shared/utils'

export class LoginDto {
  @Validate(RequireEmail)
  email: string

  @Validate(Password)
  password: string
}
