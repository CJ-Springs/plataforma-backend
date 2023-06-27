import { AllowedCurrency, ProductType } from '@prisma/client'

type AddProductCommandProps = {
  code: string
  brand: string
  model: string
  description?: string
  type: ProductType
  isGnc: boolean
  price: number
  currency?: AllowedCurrency
  spring: {
    associateToAnExistingSpring?: boolean
    code?: string
    canAssociate?: boolean
    minQuantity?: number
    quantityOnHand?: number
  }
}

export class AddProductCommand {
  constructor(public readonly data: AddProductCommandProps) {}
}
