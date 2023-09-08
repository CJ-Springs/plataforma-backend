import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { ReducePaymentAmountCommand } from '../impl/reduce-payment-amount.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(ReducePaymentAmountCommand)
export class ReducePaymentAmountHandler
  implements ICommandHandler<ReducePaymentAmountCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(
    command: ReducePaymentAmountCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Billing',
      'Ejecutando el ReducePaymentAmount command handler',
      {
        logType: 'command-handler',
      },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { paymentId, reduction },
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

    const reducePaymentAmount = invoice.reducePaymentAmount(
      paymentId,
      reduction,
    )
    if (reducePaymentAmount.isFailure) {
      throw new BadRequestException(reducePaymentAmount.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 200,
      message: `El monto del pago ${paymentId} se ha reducido`,
    }
  }

  validate(command: ReducePaymentAmountCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.paymentId, argumentName: 'paymentId' },
      { argument: command.data.reduction, argumentName: 'reduction' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
