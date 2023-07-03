import { AllowedCurrency, ProductType } from '@prisma/client'

type ProductAddedEventProps = {
  id: string
  code: string
  brand: string
  model: string
  description?: string
  type: ProductType
  isGnc: boolean
  amountOfSales: number
  price: {
    currency: AllowedCurrency
    price: number
  }
  spring: {
    id: string
    code: string
    canAssociate: boolean
    stock: {
      minQuantity: number
      quantityOnHand: number
    }
  }
}

export class ProductAddedEvent {
  constructor(public readonly data: ProductAddedEventProps) {}
}
