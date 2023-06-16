import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'

import { RegisterCustomerCommand } from '../impl/register-customer.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'

@CommandHandler(RegisterCustomerCommand)
export class RegisterCustomerHandler
  implements ICommandHandler<RegisterCustomerCommand>
{
  constructor(private readonly logger: LoggerService) {}

  async execute(command: RegisterCustomerCommand) {
    this.logger.log('Ejecutando el RegisterCustomer command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }
  }

  validate(command: RegisterCustomerCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.name, argumentName: 'name' },
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.email, argumentName: 'email' },
      { argument: command.data.cuil, argumentName: 'cuil' },
      { argument: command.data.phone, argumentName: 'phone' },
      {
        argument: command.data.paymentDeadline,
        argumentName: 'paymentDeadline',
      },
      { argument: command.data.address, argumentName: 'address' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
