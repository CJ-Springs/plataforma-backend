import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { AddProductCommand } from '../impl/add-product.command'
import { Product } from '../../aggregate/product.aggregate'
import { SpringPropsDTO } from '../../aggregate/entities/spring.entity'
import { ProductRepository } from '../../repository/product.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(AddProductCommand)
export class AddProductHandler implements ICommandHandler<AddProductCommand> {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: AddProductCommand): Promise<StandardResponse> {
    this.logger.log('Products', 'Ejecutando el AddProduct command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const productAlreadyExist = await this.prisma.product.findUnique({
      where: { code: data.code },
      select: { id: true },
    })
    if (productAlreadyExist) {
      throw new ConflictException(
        `Ya existe un producto con el código #${data.code}`,
      )
    }

    const { spring: _spring } = data
    let spring: Partial<SpringPropsDTO>

    if (_spring.associateToAnExistingSpring) {
      const existingSpring = await this.prisma.spring.findUnique({
        where: { code: _spring.code },
        include: { stock: true },
      })
      if (!existingSpring) {
        throw new NotFoundException(
          `El espiral con el código #${_spring.code} no existe`,
        )
      }
      if (!existingSpring.canAssociate) {
        throw new ConflictException(
          `El espiral con el código #${_spring.code} no es asociable`,
        )
      }

      spring = {
        ...existingSpring,
        stock: {
          ...existingSpring.stock,
        },
      }
    } else {
      spring = {
        ..._spring,
        code: data.code,
        stock: {
          quantityOnHand: _spring.quantityOnHand,
          minQuantity: _spring.minQuantity,
        },
      }
    }

    const productOrError = Product.create({
      ...data,
      code: data.code.toUpperCase(),
      amountOfSales: 0,
      price: {
        price: data.price,
        currency: data?.currency,
      },
      spring,
    })
    if (productOrError.isFailure) {
      throw new BadRequestException(productOrError.getErrorValue())
    }
    const product = productOrError.getValue()

    await this.productRepository.save(product)
    this.publisher.mergeObjectContext(product).commit()

    return {
      success: true,
      status: 201,
      message: `Producto #${data.code} (${data.brand} ${data.model}) añadido correctamente`,
      data: product.toDTO(),
    }
  }

  validate(command: AddProductCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.brand, argumentName: 'brand' },
      { argument: command.data.model, argumentName: 'model' },
      { argument: command.data.type, argumentName: 'type' },
      { argument: command.data.position, argumentName: 'position' },
      { argument: command.data.price, argumentName: 'price' },
      { argument: command.data.isGnc, argumentName: 'isGnc' },
      { argument: command.data.spring, argumentName: 'spring' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    if (!command.data.spring.associateToAnExistingSpring) {
      const validateSpring = Validate.isRequiredBulk([
        {
          argument: command.data.spring.canAssociate,
          argumentName: 'spring.canAssociate',
        },
        {
          argument: command.data.spring.minQuantity,
          argumentName: 'spring.minQuantity',
        },
        {
          argument: command.data.spring.quantityOnHand,
          argumentName: 'spring.quantityOnHand',
        },
      ])

      if (!validateSpring.success) {
        return Result.fail<string>(validateSpring.message)
      }
    } else {
      const validateSpring = Validate.isRequired(
        command.data.spring.code,
        'code',
      )

      if (!validateSpring.success) {
        return Result.fail<string>(validateSpring.message)
      }
    }

    return Result.ok()
  }
}
