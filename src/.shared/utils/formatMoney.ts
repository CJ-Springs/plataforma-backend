import { Currencies } from '@prisma/client'

export const formatMoney = (money: number, currency?: Currencies): string => {
  return new Intl.NumberFormat('es-AR', {
    currency: currency ?? Currencies.ARS,
    style: 'currency',
  }).format(money)
}
