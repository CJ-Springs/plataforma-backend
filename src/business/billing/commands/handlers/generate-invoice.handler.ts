import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import {
  CommandBus,
  CommandHandler,
  EventPublisher,
  ICommandHandler,
} from '@nestjs/cqrs'

import { Invoice } from '../../aggregate/invoice.aggregate'
import { PaymentPropsDTO } from '../../aggregate/entities/payment.entity'
import { InvoiceRepository } from '../../repository/invoice.repository'
import { GenerateInvoiceCommand } from '../impl/generate-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { DateTime, Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { ReduceBalanceCommand } from '@/business/customers/commands/impl/reduce-balance.command'

@CommandHandler(GenerateInvoiceCommand)
export class GenerateInvoiceHandler
  implements ICommandHandler<GenerateInvoiceCommand>
{
  constructor(
    private readonly commandBus: CommandBus,
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
          customer: {
            select: { code: true, paymentDeadline: true, balance: true },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException(`La orden ${orderId} no se ha encontrado`)
      })

    const dueDate = DateTime.today().addDays(
      existingOrder.customer.paymentDeadline,
    )

    const total = items.reduce((acc, item) => {
      return acc + item.salePrice * item.quantity
    }, 0)
    const roundedTotal = Math.round(total)

    const customerBalance = existingOrder.customer.balance
    let initialStatus: InvoiceStatus = InvoiceStatus.POR_PAGAR
    let deposited = 0
    const payments: Partial<PaymentPropsDTO>[] = []

    if (customerBalance > 0) {
      let payment: Partial<PaymentPropsDTO> = {
        createdBy,
        paymentMethod: PaymentMethod.SALDO_A_FAVOR,
        status: PaymentStatus.ABONADO,
      }

      if (customerBalance >= roundedTotal) {
        initialStatus = InvoiceStatus.PAGADA
        deposited = roundedTotal
        payment = { ...payment, totalAmount: roundedTotal }
      } else {
        deposited = customerBalance
        payment = { ...payment, totalAmount: customerBalance }
      }

      await this.commandBus.execute(
        new ReduceBalanceCommand({
          code: existingOrder.customer.code,
          reduction: payment.totalAmount,
        }),
      )

      payments.push(payment)
    }

    const invoiceOrError = Invoice.create({
      orderId,
      deposited,
      dueDate: dueDate.getDate(),
      status: initialStatus,
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
