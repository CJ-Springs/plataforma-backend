import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { IncrementAmountOfSalesCommand } from '../impl/increment-amount-of-sales.command'
import { ProductRepository } from '../../repository/product.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(IncrementAmountOfSalesCommand)
export class IncrementAmountOfSalesHandler
  implements ICommandHandler<IncrementAmountOfSalesCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    command: IncrementAmountOfSalesCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Products',
      'Ejecutando el IncrementAmountOfSales command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code } = data

    const productOrNull = await this.productRepository.findOneByUniqueInput({
      code,
    })
    if (!productOrNull) {
      throw new NotFoundException(`No se ha encontrado el producto ${code}`)
    }
    const product = productOrNull.getValue()

    const incrementAmountOFSalesResult = product.incrementAmountOfSales(
      data.increment,
    )
    if (incrementAmountOFSalesResult.isFailure) {
      throw new BadRequestException(
        incrementAmountOFSalesResult.getErrorValue(),
      )
    }

    await this.productRepository.save(product)
    this.publisher.mergeObjectContext(product).commit()

    return {
      success: true,
      status: 200,
      message: `El producto ${code} ha aumentado en ${data.increment} su número de ventas`,
      data: product.toDTO(),
    }
  }

  validate(command: IncrementAmountOfSalesCommand) {
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
