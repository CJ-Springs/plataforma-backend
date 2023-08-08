import { Injectable } from '@nestjs/common'
import { red, yellow, blue, bold } from 'colorette'

type Options = {
  logType?:
    | 'command-handler'
    | 'event-handler'
    | 'schedule-task'
    | 'repository'
    | 'service'
    | 'controller'
    | 'aggregate'
}

@Injectable()
export class LoggerService {
  log(context: string, message: any, options?: Options) {
    let displayContext = `[${context}]:`
    if (options?.logType) {
      const splittedText = displayContext.split(']')
      splittedText[0] = splittedText[0].concat(`::${options.logType}]`)
      displayContext = splittedText.join('')
    }

    console.log(
      `${blue(displayContext.toUpperCase())} ${
        typeof message !== 'string' ? JSON.stringify(message) : message
      }`,
    )
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
