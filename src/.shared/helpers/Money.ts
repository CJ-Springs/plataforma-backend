import { CurrenciesDontMatch } from '../errors'
import { Currency } from './Currency'
import { Result } from './Result'
import { Validate, ValidateResult } from './Validate'

export class Money {
  private cents = 0
  private currency: Currency

  private constructor(amount: number, currency: Currency) {
    this.cents = amount
    this.currency = currency
  }

  static fromString(amount: string, currency: Currency) {
    return new Money(Number(amount) * 100, currency)
  }

  static fromCents(cents: number, currency: Currency) {
    return new Money(cents, currency)
  }

  add(money: Money): Money {
    if (!this.currency.equals(money.currency)) {
      throw new CurrenciesDontMatch(
        this.currency.toString(),
        money.currency.toString(),
      )
    }
    return new Money(this.cents + money.cents, this.currency)
  }

  substract(money: Money): Money {
    if (!this.currency.equals(money.currency)) {
      throw new CurrenciesDontMatch(
        this.currency.toString(),
        money.currency.toString(),
      )
    }

    return new Money(this.cents - money.cents, this.currency)
  }

  increaseByPercentage(percentage: number) {
    const increase = this.cents * (percentage / 100)
    const sum = this.cents + increase
    const rounded = Math.round(sum)

    return Money.fromCents(rounded, this.currency)
  }

  reduceByPercentage(percentage: number) {
    const reduction = this.cents * (percentage / 100)
    const difference = this.cents - reduction
    const rounded = Math.round(difference)

    return Money.fromCents(rounded, this.currency)
  }

  roundMoney(unit: 1 | 10 | 100 | 1000): Money {
    const zeros = 100 * unit
    const rounded = Math.round(this.cents / zeros)
    const cents = rounded * zeros

    return Money.fromCents(cents, this.currency)
  }

  static validate(
    money: number | string,
    argumentName: string,
    options?: Partial<{
      validateIsGreaterOrEqualThanZero: boolean
      validateIsGreaterThanZero: boolean
      validateInRange: { min: number; max: number }
    }>,
  ): Result<ValidateResult> {
    const parseMoney = Number(money)

    if (isNaN(parseMoney)) {
      return Result.fail({
        success: false,
        message: `Invalid ${argumentName} => ${money} is not a number`,
      })
    }

    return Validate.combine(
      [
        Validate.againstNullOrUndefined(parseMoney, argumentName),
        options?.validateIsGreaterOrEqualThanZero &&
          Validate.isGreaterOrEqualThan(parseMoney, 0, argumentName),
        options?.validateIsGreaterThanZero &&
          Validate.isGreaterThan(parseMoney, 0, argumentName),
        options?.validateInRange &&
          Validate.inRange(
            parseMoney,
            options.validateInRange.min,
            options.validateInRange.max,
            argumentName,
          ),
      ].filter(Boolean),
    )
  }

  getCurrency() {
    return this.currency
  }

  getCents() {
    return this.cents
  }

  getFormattedMoney() {
    return new Intl.NumberFormat('es-AR', {
      currency: this.currency.getValue(),
      style: 'currency',
    }).format(this.getValue())
  }

  getValue() {
    //return rounded value to 2 decimal places
    return Number(Math.round(this.cents / 100).toFixed(2))
  }
}
