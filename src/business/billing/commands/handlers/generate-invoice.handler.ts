import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { Invoice } from '../../aggregate/invoice.aggregate'
import { PaymentPropsDTO } from '../../aggregate/entities/payment.entity'
import { InvoiceRepository } from '../../repository/invoice.repository'
import { GenerateInvoiceCommand } from '../impl/generate-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { getTimeZone } from '@/.shared/utils'

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
    this.logger.log(
      'Billing',
      'Ejecutando el GenerateInvoice command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { orderId, items, createdBy },
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
    const roundedTotal = Math.round(total)

    const customerBalance = existingOrder.customer.balance
    let status: InvoiceStatus = InvoiceStatus.POR_PAGAR
    let deposited = 0
    const payments: Partial<PaymentPropsDTO>[] = []

    if (customerBalance > 0) {
      if (customerBalance >= roundedTotal) {
        status = InvoiceStatus.PAGADA
        deposited = roundedTotal
        payments.push({
          amount: roundedTotal,
          createdBy,
          paymentMethod: PaymentMethod.SALDO_A_FAVOR,
          status: PaymentStatus.ABONADO,
        })
      } else {
        deposited = customerBalance
        payments.push({
          amount: customerBalance,
          createdBy,
          paymentMethod: PaymentMethod.SALDO_A_FAVOR,
          status: PaymentStatus.ABONADO,
        })
      }
    }

    const dueDate = getTimeZone()
    dueDate.setDate(dueDate.getDate() + existingOrder.customer.paymentDeadline)

    const invoiceOrError = Invoice.create({
      orderId,
      deposited,
      dueDate,
      status,
      total: roundedTotal,
      payments,
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
      { argument: command.data.createdBy, argumentName: 'createdBy' },
      { argument: command.data.items, argumentName: 'items' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
