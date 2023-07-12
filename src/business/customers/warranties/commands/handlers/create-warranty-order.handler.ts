import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { CreateWarrantyOrderCommand } from '../impl/create-warranty-order.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

type StockRequested = {
  springCode: string
  productsCode: string[]
  quantityOnHand: number
  requested: number
}

@CommandHandler(CreateWarrantyOrderCommand)
export class CreateWarrantyOrderHandler
  implements ICommandHandler<CreateWarrantyOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: CreateWarrantyOrderCommand,
  ): Promise<StandardResponse> {
    this.logger.log('Ejecutando el CreateWarrantyOrder command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    await this.prisma.customer
      .findUniqueOrThrow({
        where: { code: data.customerCode },
        select: { code: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `El cliente ${data.customerCode} no se ha encontrado`,
        )
      })

    const itemsMap = data.items.reduce((acc, { productCode, requested }) => {
      if (acc.has(productCode)) {
        const prevRequested = acc.get(productCode)
        return acc.set(productCode, prevRequested + requested)
      }

      return acc.set(productCode, requested)
    }, new Map<string, number>())

    let stocksRequested: StockRequested[] = []

    for await (const [code, requested] of itemsMap) {
      const existingProduct = await this.prisma.product
        .findUniqueOrThrow({
          where: { code },
          select: {
            spring: {
              select: {
                code: true,
                stock: { select: { quantityOnHand: true } },
              },
            },
          },
        })
        .catch(() => {
          throw new NotFoundException(`El producto ${code} no se ha encontrado`)
        })

      const { code: springCode, stock } = existingProduct.spring

      const sharedStock = stocksRequested.find(
        (stock) => stock.springCode === springCode,
      )

      if (sharedStock) {
        stocksRequested = stocksRequested.map((stock) =>
          stock.springCode === springCode
            ? {
                ...stock,
                requested: stock.requested + requested,
                productsCode: [...stock.productsCode, code],
              }
            : stock,
        )
      } else {
        stocksRequested.push({
          springCode,
          quantityOnHand: stock.quantityOnHand,
          requested,
          productsCode: [code],
        })
      }
    }

    for (const {
      productsCode,
      requested,
      quantityOnHand,
      springCode,
    } of stocksRequested) {
      if (requested > quantityOnHand) {
        const isOneProduct = productsCode.length === 1

        throw new ConflictException(
          `No se posee el suficiente stock para ${
            isOneProduct ? 'el producto' : 'los productos'
          } ${productsCode.join(
            ', ',
          )} (espiral ${springCode} - stock en mano ${quantityOnHand} - stock solicitado ${requested})`,
        )
      }
    }

    // const orderOrError = IncomeOrder.create({
    //   userId: data.userId,
    //   status: IncomeOrderStatus.EN_PROGRESO,
    //   items: Array.from(itemsMap).map(([productCode, entered]) => ({
    //     productCode,
    //     entered,
    //   })),
    // })
    // if (orderOrError.isFailure) {
    //   throw new BadRequestException(orderOrError.getErrorValue())
    // }
    // const order = orderOrError.getValue()

    // await this.orderRepository.save(order)
    // this.publisher.mergeObjectContext(order).commit()

    return {
      success: true,
      status: 201,
      message: 'Orden de ingreso creada correctamente',
    }
  }

  validate(command: CreateWarrantyOrderCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.createdBy, argumentName: 'createdBy' },
      { argument: command.data.customerCode, argumentName: 'customerCode' },
      { argument: command.data.items, argumentName: 'items' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
