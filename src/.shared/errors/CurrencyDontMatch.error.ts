import { HttpException, HttpStatus } from '@nestjs/common'

export class CurrenciesDontMatch extends HttpException {
  constructor(first: string, second: string) {
    super(
      {
        status: HttpStatus.BAD_REQUEST,
        message: `Currencies [${first}] and [${second}] don't match`,
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}
