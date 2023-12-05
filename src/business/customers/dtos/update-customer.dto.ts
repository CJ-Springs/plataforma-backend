import { IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { PartialType, OmitType } from '@nestjs/swagger'

import { RegisterCustomerDto } from './register-customer.dto'
import { PartialAddressDto } from './address.dto'

export class UpdateCustomerDto extends PartialType(
  OmitType(RegisterCustomerDto, ['code', 'email', 'address']),
) {
  @IsOptional()
  name?: string

  @IsOptional()
  phone?: string

  @IsOptional()
  paymentDeadline?: number

  @IsOptional()
  @Type(() => PartialAddressDto)
  @ValidateNested()
  address?: PartialAddressDto
}
