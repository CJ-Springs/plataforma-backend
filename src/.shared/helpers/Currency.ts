import { Currencies } from '@prisma/client'

export class Currency {
  private type: Currencies

  private constructor(type: Currencies = Currencies.ARS) {
    this.type = type
  }

  static create(type?: Currencies): Currency {
    return new Currency(type)
  }

  equals(that: Currency): boolean {
    return this.type === that.type
  }

  toString(): string {
    return this.type.toString()
  }

  getValue(): Currencies {
    return this.type
  }
}
