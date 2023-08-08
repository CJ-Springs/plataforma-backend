import { ProductType } from '@prisma/client'
import { IntersectionType, PickType } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'

import { AddProductDto } from './add-product.dto'

export class UpdateProductDto extends IntersectionType(
  PickType(AddProductDto, ['brand', 'model', 'description', 'isGnc', 'type']),
) {
  @IsOptional()
  brand: string

  @IsOptional()
  model: string

  @IsOptional()
  isGnc: boolean

  @IsOptional()
  type: ProductType
}
