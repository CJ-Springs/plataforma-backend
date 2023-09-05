import * as daysjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc.js'
daysjs.extend(utc)

import { DateTimeValidationError } from './../errors'
import { Validate } from './Validate'

export class DateTime {
  private date: Date

  private constructor(date: Date, keepLocalTime = true) {
    this.date = daysjs(date).utc(keepLocalTime).toDate()
  }

  static createFromDate(date: Date, keepLocalTime = true): DateTime {
    const nullPropResult = Validate.isDate(date, 'date')
    if (!nullPropResult.success) {
      throw new DateTimeValidationError(nullPropResult.message!)
    }

    try {
      return new DateTime(date, keepLocalTime)
    } catch (err: any) {
      throw new DateTimeValidationError(`${err.name} ${err.message}`)
    }
  }

  static createFromString(dateStr: string, keepLocalTime = true): DateTime {
    const date = daysjs(dateStr).toDate()

    const nullPropResult = Validate.isDate(date, 'date')
    if (!nullPropResult.success) {
      throw new DateTimeValidationError(nullPropResult.message!)
    }

    return DateTime.createFromDate(date, keepLocalTime)
  }

  static now(): DateTime {
    return new DateTime(new Date())
  }

  static utcNow(): DateTime {
    return new DateTime(new Date(), false)
  }

  static today(): DateTime {
    const today = daysjs().utc(true).startOf('day').toDate()

    return new DateTime(today, false)
  }

  static utcToday(): DateTime {
    const today = daysjs().utc(false).startOf('day').toDate()

    return new DateTime(today, false)
  }

  getDate(): Date {
    return this.date
  }

  getHours() {
    return this.date.getHours()
  }

  greaterThan(d: DateTime): boolean {
    return this.date > d.date
  }

  greaterThanOrEqual(d: DateTime): boolean {
    return this.date >= d.date
  }

  lowerThan(d: DateTime): boolean {
    return this.date < d.date
  }

  lowerThanOrEqual(d: DateTime): boolean {
    return this.date <= d.date
  }

  dayDiff(d: DateTime): number {
    const d1 = daysjs(this.date).utc().startOf('day')
    const d2 = daysjs(d.date).utc().startOf('day')

    return d1.diff(d2, 'day')
  }

  addDays(days: number): DateTime {
    const date = daysjs(this.date)

    return DateTime.createFromDate(date.add(days, 'day').toDate(), false)
  }

  getFormattedDate(opts?: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('es-AR', opts).format(this.getDate())
  }
}
