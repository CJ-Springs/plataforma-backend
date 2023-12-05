import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { UpdateCustomerCommand } from '../impl/update-customer.command'
import { CustomerRepository } from '../../repository/customer.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler
  implements ICommandHandler<UpdateCustomerCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers',
      'Ejecutando el UpdateCustomer command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { code, ...props },
    } = command

    const customerOrNull = await this.customerRepository.findOneByUniqueInput({
      code,
    })
    if (!customerOrNull) {
      throw new NotFoundException(
        `No se ha encontrado al cliente con el código ${code}`,
      )
    }
    const customer = customerOrNull.getValue()

    const customerResult = customer.update(props)
    if (customerResult.isFailure) {
      throw new BadRequestException(customerResult.getErrorValue())
    }

    await this.customerRepository.save(customer)
    this.publisher.mergeObjectContext(customer).commit()

    return {
      success: true,
      status: 200,
      message: `Cliente ${code} actualizado correctamente`,
      data: customerResult.getValue().toDTO(),
    }
  }

  validate(command: UpdateCustomerCommand) {
    const validation = Validate.isRequired(command.data.code, 'code')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
