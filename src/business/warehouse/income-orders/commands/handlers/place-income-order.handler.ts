import { IncomeOrderStatus } from '@prisma/client'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { IncomeOrder } from '../../aggregate/income-order.aggregate'
import { IncomeOrderRepository } from '../../repository/income-order.repository'
import { PlaceIncomeOrderCommand } from '../impl/place-income-order.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(PlaceIncomeOrderCommand)
export class PlaceIncomeOrderHandler
  implements ICommandHandler<PlaceIncomeOrderCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly prisma: PrismaService,
    private readonly orderRepository: IncomeOrderRepository,
  ) {}

  async execute(command: PlaceIncomeOrderCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el PlaceIncomeOrder command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    const itemsMap = data.items.reduce((acc, { productCode, entered }) => {
      if (acc.has(productCode)) {
        const prevEntered = acc.get(productCode)
        return acc.set(productCode, prevEntered + entered)
      }

      return acc.set(productCode, entered)
    }, new Map<string, number>())

    for await (const [code] of itemsMap) {
      await this.prisma.product
        .findUniqueOrThrow({ where: { code } })
        .catch(() => {
          throw new NotFoundException(`El producto ${code} no se ha encontrado`)
        })
    }

    const orderOrError = IncomeOrder.create({
      userId: data.userId,
      status: IncomeOrderStatus.EN_PROGRESO,
      items: Array.from(itemsMap).map(([productCode, entered]) => ({
        productCode,
        entered,
      })),
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
      message: 'Orden de ingreso creada correctamente',
      data: order.toDTO(),
    }
  }

  validate(command: PlaceIncomeOrderCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.userId, argumentName: 'userId' },
      { argument: command.data.items, argumentName: 'items' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
