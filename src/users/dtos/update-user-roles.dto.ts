import { AppRole } from '@prisma/client'
import { ArrayNotEmpty, IsArray, Validate } from 'class-validator'
import { RequireValueForEnum } from '@/.shared/utils'

export class UpdateUserRolesDto {
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  @ArrayNotEmpty({ message: "El campo 'roles' no puede ser un array vacío" })
  @Validate(RequireValueForEnum, [AppRole], { each: true })
  roles: AppRole[]
}
