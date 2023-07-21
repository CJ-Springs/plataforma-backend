import { InvoiceStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { Invoice } from '../../aggregate/invoice.aggregate'
import { InvoiceRepository } from '../../repository/invoice.repository'
import { GenerateInvoiceCommand } from '../impl/generate-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

// TODO:
// 1. Cron para cambiar el estado a DEUDA de aquellas facturas que vencieron y no fueron pagadas
// 2. Revisar como se almacena la due date de la factura en la DB
@CommandHandler(GenerateInvoiceCommand)
export class GenerateInvoiceHandler
  implements ICommandHandler<GenerateInvoiceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(command: GenerateInvoiceCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el GenerateInvoice command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { orderId, items },
    } = command

    const existingOrder = await this.prisma.saleOrder
      .findUniqueOrThrow({
        where: { id: orderId },
        select: {
          customer: { select: { paymentDeadline: true, balance: true } },
        },
      })
      .catch(() => {
        throw new NotFoundException(`La orden ${orderId} no se ha encontrado`)
      })

    const total = items.reduce((acc, item) => {
      return acc + item.salePrice * item.quantity
    }, 0)

    // const today = new Date()
    // today.setHours(23, 59, 59, 999)
    // const dueDate = new Date(
    //   today.setDate(today.getDate() + existingOrder.customer.paymentDeadline),
    // )
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const dueDate = new Date(
      today.setDate(today.getDate() - existingOrder.customer.paymentDeadline),
    )

    const invoiceOrError = Invoice.create({
      orderId,
      deposited: 0,
      dueDate,
      status: InvoiceStatus.POR_PAGAR,
      total,
    })
    if (invoiceOrError.isFailure) {
      throw new BadRequestException(invoiceOrError.getErrorValue())
    }
    const invoice = invoiceOrError.getValue()

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 201,
      message: `Factura de la orden ${orderId} generada`,
      data: invoice.toDTO(),
    }
  }

  validate(command: GenerateInvoiceCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.orderId, argumentName: 'createdBy' },
      { argument: command.data.items, argumentName: 'items' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
