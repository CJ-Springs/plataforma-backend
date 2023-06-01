import { Injectable } from '@nestjs/common'
import { red, yellow, blue, bold } from 'colorette'

@Injectable()
export class LoggerService {
  log(message: any, context?: string) {
    if (context) {
      console.log(`📌 ${context} 👇`)
    }

    console.log(blue(JSON.stringify(message)))
  }

  error(message: any, context?: string) {
    if (context) {
      console.log(bold(`🚨 ${context} 👇`))
    }

    console.error(red(JSON.stringify(message)))
  }

  warn(message: any, context?: string) {
    if (context) {
      console.log(bold(`⚠️  ${context} 👇`))
    }

    console.warn(yellow(JSON.stringify(message)))
  }

  table(obj: object | object[]) {
    console.table(obj)
  }
}
