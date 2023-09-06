import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import {
  CommandBus,
  CommandHandler,
  EventPublisher,
  ICommandHandler,
} from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { PaymentWithCustomerBalanceCommand } from '../impl/payment-with-customer-balance.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { formatConstantValue } from '@/.shared/utils'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { ReduceBalanceCommand } from '@/business/customers/commands/impl/reduce-balance.command'

@CommandHandler(PaymentWithCustomerBalanceCommand)
export class PaymentWithCustomerBalanceHandler
  implements ICommandHandler<PaymentWithCustomerBalanceCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly commandBus: CommandBus,
    private readonly publisher: EventPublisher,
    private readonly prisma: PrismaService,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(
    command: PaymentWithCustomerBalanceCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Billing',
      'Ejecutando el PaymentWithCustomerBalance command handler',
      {
        logType: 'command-handler',
      },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { invoiceId, createdBy },
    } = command

    const invoiceOrNull = await this.invoiceRepository.findOneById(invoiceId)
    if (!invoiceOrNull) {
      throw new NotFoundException(`No se ha encontrado la factura ${invoiceId}`)
    }
    const invoice = invoiceOrNull.getValue()

    const { customer } = await this.prisma.saleOrder.findUnique({
      where: { id: invoice.props.orderId.toString() },
      select: {
        customer: {
          select: {
            code: true,
            balance: true,
          },
        },
      },
    })

    if (customer.balance <= 0) {
      throw new BadRequestException(
        `El cliente #${customer.code} no tiene saldo a favor`,
      )
    }

    const amount =
      invoice.getLeftToPay() > customer.balance
        ? customer.balance
        : invoice.getLeftToPay()

    const addPaymentResult = invoice.addPayment({
      amount,
      createdBy,
      paymentMethod: PaymentMethod.SALDO_A_FAVOR,
      status: PaymentStatus.ABONADO,
    })
    if (addPaymentResult.isFailure) {
      throw new BadRequestException(addPaymentResult.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    await this.commandBus.execute(
      new ReduceBalanceCommand({
        code: customer.code,
        reduction: amount,
      }),
    )

    return {
      success: true,
      status: 201,
      message: `Pago con ${formatConstantValue(
        PaymentMethod.SALDO_A_FAVOR,
      )} de monto ${invoice.props.payments
        .at(-1)
        .props.amount.getFormattedMoney()} registrado a la factura ${invoiceId}`,
      data: invoice.toDTO(),
    }
  }

  validate(command: PaymentWithCustomerBalanceCommand) {
    const validation = Validate.isRequiredBulk([
      {
        argument: command.data.invoiceId,
        argumentName: 'invoiceId',
      },
      {
        argument: command.data.createdBy,
        argumentName: 'createdBy',
      },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
