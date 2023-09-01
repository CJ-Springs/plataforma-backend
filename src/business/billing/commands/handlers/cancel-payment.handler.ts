import { PaymentStatus } from '@prisma/client'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { CancelPaymentCommand } from '../impl/cancel-payment.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(CancelPaymentCommand)
export class CancelPaymentHandler
  implements ICommandHandler<CancelPaymentCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(command: CancelPaymentCommand): Promise<StandardResponse> {
    this.logger.log('Billing', 'Ejecutando el CancelPayment command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { paymentId, canceledBy },
    } = command

    const invoiceOrNull = await this.invoiceRepository.findOneByInput({
      payments: { some: { id: paymentId } },
    })
    if (!invoiceOrNull) {
      throw new NotFoundException(
        `No se ha encontrado la factura con el pago ${paymentId}`,
      )
    }
    const invoice = invoiceOrNull.getValue()

    // review
    // const paymentToUpdate = invoice.findPayment(paymentId)
    // if (paymentToUpdate.props.depositId) {
    //   throw new ConflictException(
    //     'El pago fue realizado a partir de un depósito, por lo que no se puede cancelar de manera individual',
    //   )
    // }

    const cancelPaymentResult = invoice.cancelPayment(paymentId, canceledBy)
    if (cancelPaymentResult.isFailure) {
      throw new BadRequestException(cancelPaymentResult.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 200,
      message: `Pago perteneciente a la factura ${invoice.props.id.toString()} marcado como ${
        PaymentStatus.ANULADO
      }`,
      data: invoice.toDTO(),
    }
  }

  validate(command: CancelPaymentCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.paymentId, argumentName: 'paymentId' },
      { argument: command.data.canceledBy, argumentName: 'canceledBy' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
