import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, ConflictException } from '@nestjs/common'

import { RegisterCustomerCommand } from '../impl/register-customer.command'
import { Customer } from '../../aggregate/customer.aggregate'
import { CustomerRepository } from '../../repository/customer.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(RegisterCustomerCommand)
export class RegisterCustomerHandler
  implements ICommandHandler<RegisterCustomerCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(command: RegisterCustomerCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers',
      'Ejecutando el RegisterCustomer command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const customerCodeInUse = await this.prisma.customer.findUnique({
      where: { code: data.code },
    })
    if (customerCodeInUse) {
      throw new ConflictException(
        `El código #${data.code} ya le pertenece a otro cliente`,
      )
    }

    const customerEmailInUse = await this.prisma.customer.findUnique({
      where: { email: data.email },
    })
    if (customerEmailInUse) {
      throw new ConflictException(
        `El email ${data.email} ya le pertenece a otro cliente`,
      )
    }

    const customerOrError = Customer.create({
      ...data,
      balance: 0,
      address: {
        ...data.address,
        country: data.address?.country ?? 'Argentina',
      },
    })
    if (customerOrError.isFailure) {
      throw new BadRequestException(customerOrError.getErrorValue())
    }
    const customer = customerOrError.getValue()

    await this.customerRepository.save(customer)
    this.publisher.mergeObjectContext(customer).commit()

    return {
      success: true,
      status: 201,
      message: 'Nuevo cliente registrado correctamente',
      data: customer.toDTO(),
    }
  }

  validate(command: RegisterCustomerCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.name, argumentName: 'name' },
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.email, argumentName: 'email' },
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
