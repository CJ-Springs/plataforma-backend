import { ProductType } from '@prisma/client'

type ProductUpdatedEventProps = {
  code: string
  brand?: string
  model?: string
  description?: string
  type?: ProductType
  isGnc?: boolean
}

export class ProductUpdatedEvent {
  constructor(public readonly data: ProductUpdatedEventProps) {}
}
