import { ProductPosition, ProductType } from '@prisma/client'

type ProductUpdatedEventProps = {
  code: string
  brand?: string
  model?: string
  description?: string
  type?: ProductType
  position?: ProductPosition
  isGnc?: boolean
}

export class ProductUpdatedEvent {
  constructor(public readonly data: ProductUpdatedEventProps) {}
}
