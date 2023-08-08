import { ProductType } from '@prisma/client'

type UpdateProductCommandProps = {
  code: string
  brand?: string
  model?: string
  description?: string
  type?: ProductType
  isGnc?: boolean
}

export class UpdateProductCommand {
  constructor(public readonly data: UpdateProductCommandProps) {}
}
