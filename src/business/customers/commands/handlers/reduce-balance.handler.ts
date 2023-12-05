import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { ReduceBalanceCommand } from '../impl/reduce-balance.command'
import { CustomerRepository } from '../../repository/customer.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ReduceBalanceCommand)
export class ReduceBalanceHandler
  implements ICommandHandler<ReduceBalanceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: ReduceBalanceCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers',
      'Ejecutando el ReduceBalance command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code } = data

    const customerOrNull = await this.customerRepository.findOneByUniqueInput({
      code,
    })
    if (!customerOrNull) {
      throw new NotFoundException(`No se ha encontrado al cliente ${code}`)
    }
    const customer = customerOrNull.getValue()

    const reduceBalanceResult = customer.reduceBalance(data.reduction)
    if (reduceBalanceResult.isFailure) {
      throw new BadRequestException(reduceBalanceResult.getErrorValue())
    }

    await this.customerRepository.save(customer)
    this.publisher.mergeObjectContext(customer).commit()

    return {
      success: true,
      status: 200,
      message: `Balance del cliente ${code} reducido $${data.reduction}`,
      data: customer.toDTO(),
    }
  }

  validate(command: ReduceBalanceCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.reduction, argumentName: 'reduction' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
