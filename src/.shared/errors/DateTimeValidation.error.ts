import { HttpException, HttpStatus } from '@nestjs/common'

export class DateTimeValidationError extends HttpException {
  constructor(public readonly message: string) {
    super({ message, status: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST)
  }
}
