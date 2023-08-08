import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { UpdateProductCommand } from '../impl/update-product.command'
import { ProductRepository } from '../../repository/product.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler
  implements ICommandHandler<UpdateProductCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<StandardResponse> {
    this.logger.log('Products', 'Ejecutando el UpdateProduct command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { code, ...data },
    } = command

    const productOrNull = await this.productRepository.findOneByUniqueInput({
      code,
    })
    if (!productOrNull) {
      throw new NotFoundException(`El producto #${code} no se ha encontrado`)
    }
    const product = productOrNull.getValue()

    const updateProductResult = product.update(data)
    if (updateProductResult.isFailure) {
      throw new BadRequestException(updateProductResult.getErrorValue())
    }

    await this.productRepository.save(product)
    this.publisher.mergeObjectContext(product).commit()

    const keys = Object.keys(data)

    return {
      success: true,
      status: 200,
      message: `Se ${
        keys.length === 1
          ? 'ha actualizado el campo'
          : 'han actualizado los campos'
      } ${keys.join(', ')} del producto #${code}`,
      data: product.toDTO(),
    }
  }

  validate(command: UpdateProductCommand) {
    const productCodeValidation = Validate.isRequired(command.data.code, 'code')
    if (!productCodeValidation.success) {
      return Result.fail<string>(productCodeValidation.message)
    }

    const validation = Validate.isAnyRequired(
      command.data,
      'brand',
      'model',
      'description',
      'type',
      'isGnc',
    )
    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
