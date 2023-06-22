export enum AllowedCurrency {
  ARS = 'ARS',
  USD = 'USD',
}

export class Currency {
  private type: AllowedCurrency

  private constructor(type = AllowedCurrency.ARS) {
    this.type = type
  }

  static create(type?: AllowedCurrency): Currency {
    return new Currency(type)
  }

  equals(that: Currency): boolean {
    return this.type === that.type
  }

  toString(): string {
    return this.type.toString()
  }

  getValue(): AllowedCurrency {
    return this.type
  }
}