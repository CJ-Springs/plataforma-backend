import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { PayInvoiceCommand } from '../impl/pay-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(PayInvoiceCommand)
export class PayInvoiceHandler implements ICommandHandler<PayInvoiceCommand> {
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(command: PayInvoiceCommand): Promise<StandardResponse> {
    this.logger.log('Ejecutando el PayInvoice command handler')

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { invoiceId },
    } = command

    const invoiceOrNull = await this.invoiceRepository.findOneById(invoiceId)
    if (!invoiceOrNull) {
      throw new NotFoundException(`No se ha encontrado la factura ${invoiceId}`)
    }
    const invoice = invoiceOrNull.getValue()

    const payInvoiceResult = invoice.pay()
    if (payInvoiceResult.isFailure) {
      throw new BadRequestException(payInvoiceResult.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 200,
      message: `Factura de la orden ${invoice.props.orderId.toString()} marcada como "PAGADA"`,
      data: invoice.toDTO(),
    }
  }

  validate(command: PayInvoiceCommand) {
    const validation = Validate.isRequired(command.data.invoiceId, 'invoiceId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
