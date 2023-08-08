import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { PlaceSaleOrderCommand } from '../impl/place-sale-order.command'
import { SaleOrder } from '../../aggregate/sale-order.aggregate'
import { SaleOrderRepository } from '../../repository/sale-order.repository'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

type StockRequested = {
  productsCode: string[]
  quantityOnHand: number
  requested: number
}

@CommandHandler(PlaceSaleOrderCommand)
export class PlaceSaleOrderHandler
  implements ICommandHandler<PlaceSaleOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly orderRepository: SaleOrderRepository,
  ) {}

  async execute(command: PlaceSaleOrderCommand): Promise<StandardResponse> {
    this.logger.log('Sales', 'Ejecutando el PlaceSaleOrder command handler', {
      logType: 'command-handler',
    })

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

    const itemsMap = data.items.reduce((acc, { productCode, ...item }) => {
      if (acc.has(productCode)) {
        const { requested, discount } = acc.get(productCode)

        return acc.set(productCode, {
          requested: requested + item.requested,
          discount:
            item.discount && item.discount > (discount ?? 0)
              ? item.discount
              : discount,
        })
      }

      return acc.set(productCode, {
        requested: item.requested,
        discount: item?.discount,
      })
    }, new Map<string, { requested: number; discount?: number }>())

    const items = await Promise.all(
      Array.from(itemsMap).map(async ([code, { requested, discount }]) => {
        const existingProduct = await this.prisma.product
          .findUniqueOrThrow({
            where: { code },
            include: {
              price: true,
              spring: {
                select: {
                  code: true,
                  stock: { select: { quantityOnHand: true } },
                },
              },
            },
          })
          .catch(() => {
            throw new NotFoundException(
              `El producto ${code} no se ha encontrado`,
            )
          })

        return {
          productCode: code,
          requested,
          price: existingProduct.price.price,
          springCode: existingProduct.spring.code,
          discount,
          quantityOnHand: existingProduct.spring.stock.quantityOnHand,
        }
      }),
    )

    const stocksRequested = items.reduce((acc, { springCode, ...item }) => {
      if (acc.has(springCode)) {
        const sharedSpring = acc.get(springCode)

        return acc.set(springCode, {
          ...sharedSpring,
          requested: sharedSpring.requested + item.requested,
          productsCode: [...sharedSpring.productsCode, item.productCode],
        })
      }

      return acc.set(springCode, {
        quantityOnHand: item.quantityOnHand,
        requested: item.requested,
        productsCode: [item.productCode],
      })
    }, new Map<string, StockRequested>())

    for (const [
      springCode,
      { productsCode, requested, quantityOnHand },
    ] of stocksRequested) {
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

    const orderOrError = SaleOrder.create({
      ...data,
      items,
    })
    if (orderOrError.isFailure) {
      throw new BadRequestException(orderOrError.getErrorValue())
    }
    const order = orderOrError.getValue()

    await this.orderRepository.save(order)
    this.publisher.mergeObjectContext(order).commit()

    return {
      success: true,
      status: 201,
      message: `Orden de venta creada (cliente ${data.customerCode})`,
      data: order.toDTO(),
    }
  }

  validate(command: PlaceSaleOrderCommand) {
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
