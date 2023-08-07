import * as daysjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc.js'

// import { DateTimeValidationError } from '../error/dateTimeValidationError.js'
import { Validate } from './Validate'

export class DateTime {
  public date: Date

  private constructor(date: Date, keepLocalTime = true) {
    daysjs.extend(utc)
    this.date = daysjs(date).utc(keepLocalTime).toDate()
  }

  static createFromDate(date: Date, keepLocalTime = true): DateTime {
    const nullPropResult = Validate.isDate(date, 'date')
    // if (!nullPropResult.success) {
    //   throw new DateTimeValidationError(nullPropResult.message!)
    // }

    return new DateTime(date, keepLocalTime)
    try {
    } catch (err: any) {
      //   throw new DateTimeValidationError(`${err.name} ${err.message}`)
    }
  }

  static createFromString(dateStr: string, keepLocalTime = true): DateTime {
    const date = daysjs(dateStr).toDate()
    return DateTime.createFromDate(date, keepLocalTime)
  }

  static now(): DateTime {
    return new DateTime(new Date())
  }

  static today(): DateTime {
    const today = daysjs().startOf('day').toDate()
    return new DateTime(today)
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
    const date = daysjs(this.date).utc()
    return DateTime.createFromDate(date.add(days, 'day').toDate())
  }
}
