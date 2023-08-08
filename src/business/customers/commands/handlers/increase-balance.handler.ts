import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { IncreaseBalanceCommand } from '../impl/increase-balance.command'
import { CustomerRepository } from '../../repository/customer.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(IncreaseBalanceCommand)
export class IncreaseBalanceHandler
  implements ICommandHandler<IncreaseBalanceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: IncreaseBalanceCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers',
      'Ejecutando el IncreaseBalance command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { code, increment },
    } = command

    const customerOrNull = await this.customerRepository.findOneByUniqueInput({
      code,
    })
    if (!customerOrNull) {
      throw new NotFoundException(`No se ha encontrado al cliente ${code}`)
    }
    const customer = customerOrNull.getValue()

    const increaseBalanceResult = customer.increaseBalance(increment)
    if (increaseBalanceResult.isFailure) {
      throw new BadRequestException(increaseBalanceResult.getErrorValue())
    }

    await this.customerRepository.save(customer)
    this.publisher.mergeObjectContext(customer).commit()

    return {
      success: true,
      status: 200,
      message: `Balance del cliente ${code} aumentado $${increment}`,
      data: customer.toDTO(),
    }
  }

  validate(command: IncreaseBalanceCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.increment, argumentName: 'increment' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
