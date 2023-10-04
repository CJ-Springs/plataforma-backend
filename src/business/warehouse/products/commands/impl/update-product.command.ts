import { ProductPosition, ProductType } from '@prisma/client'

type UpdateProductCommandProps = {
  code: string
  brand?: string
  model?: string
  description?: string
  type?: ProductType
  position?: ProductPosition
  isGnc?: boolean
}

export class UpdateProductCommand {
  constructor(public readonly data: UpdateProductCommandProps) {}
}
