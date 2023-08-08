import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { DueInvoiceCommand } from '../impl/due-invoice.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(DueInvoiceCommand)
export class DueInvoiceHandler implements ICommandHandler<DueInvoiceCommand> {
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(command: DueInvoiceCommand): Promise<StandardResponse> {
    this.logger.log('Billing', 'Ejecutando el DueInvoice command handler', {
      logType: 'command-handler',
    })

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

    const dueInvoiceResult = invoice.due()
    if (dueInvoiceResult.isFailure) {
      throw new BadRequestException(dueInvoiceResult.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 200,
      message: `Factura de la órden ${invoice.props.orderId.toString()} marcada como "DEUDA"`,
      data: invoice.toDTO(),
    }
  }

  validate(command: DueInvoiceCommand) {
    const validation = Validate.isRequired(command.data.invoiceId, 'invoiceId')

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
