import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { InvoiceRepository } from '../../repository/invoice.repository'
import { AddPaymentCommand } from '../impl/add-payment.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(AddPaymentCommand)
export class AddPaymentHandler implements ICommandHandler<AddPaymentCommand> {
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(command: AddPaymentCommand): Promise<StandardResponse> {
    this.logger.log('Billing', 'Ejecutando el AddPayment command handler', {
      logType: 'command-handler',
    })

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { invoiceId, createdBy, amount, paymentMethod, ...metadata },
    } = command
    const emptyMetadata = !Object.values(metadata).length

    const invoiceOrNull = await this.invoiceRepository.findOneById(invoiceId)
    if (!invoiceOrNull) {
      throw new NotFoundException(`No se ha encontrado la factura ${invoiceId}`)
    }
    const invoice = invoiceOrNull.getValue()

    const appendPaymentResult = invoice.addPayment({
      amount,
      createdBy,
      paymentMethod,
      status: PaymentStatus.ABONADO,
      metadata: emptyMetadata ? undefined : metadata,
    })
    if (appendPaymentResult.isFailure) {
      throw new BadRequestException(appendPaymentResult.getErrorValue())
    }

    await this.invoiceRepository.save(invoice)
    this.publisher.mergeObjectContext(invoice).commit()

    return {
      success: true,
      status: 200,
      message: `Pago con ${paymentMethod
        .split('_')
        .join(' ')
        .toLowerCase()} de monto $${amount} registrado a la factura ${invoiceId}`,
      data: invoice.toDTO(),
    }
  }

  validate(command: AddPaymentCommand) {
    const validation = Validate.isRequiredBulk([
      {
        argument: command.data.invoiceId,
        argumentName: 'invoiceId',
      },
      {
        argument: command.data.createdBy,
        argumentName: 'createdBy',
      },
      {
        argument: command.data.amount,
        argumentName: 'amount',
      },
      {
        argument: command.data.paymentMethod,
        argumentName: 'paymentMethod',
      },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    const { paymentMethod } = command.data

    // VALIDATE EFECTIVO PAYMENT

    if (paymentMethod === PaymentMethod.EFECTIVO) {
      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.mpUser,
          argumentName: 'mpUser',
        },
        {
          argument: command.data.voucherNumber,
          argumentName: 'voucherNumber',
        },
        {
          argument: command.data.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.cvu,
          argumentName: 'cvu',
        },
        {
          argument: command.data.code,
          argumentName: 'code',
        },
        {
          argument: command.data.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.thirdParty,
          argumentName: 'thirdParty',
        },
      ])

      if (!guardAgainstPropertiesShouldNotExist.success) {
        return Result.fail<string>(guardAgainstPropertiesShouldNotExist.message)
      }
    }

    // VALIDATE MERCADO PAGO PAYMENT

    if (paymentMethod === PaymentMethod.MERCADO_PAGO) {
      const validateMpPayment = Validate.isRequiredBulk([
        { argument: command.data.mpUser, argumentName: 'mpUser' },
        {
          argument: command.data.voucherNumber,
          argumentName: 'voucherNumber',
        },
      ])

      if (!validateMpPayment.success) {
        return Result.fail<string>(validateMpPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.cvu,
          argumentName: 'cvu',
        },
        {
          argument: command.data.code,
          argumentName: 'code',
        },
        {
          argument: command.data.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.thirdParty,
          argumentName: 'thirdParty',
        },
      ])

      if (!guardAgainstPropertiesShouldNotExist.success) {
        return Result.fail<string>(guardAgainstPropertiesShouldNotExist.message)
      }
    }

    // VALIDATE TRANSFERENCIA PAYMENT

    if (paymentMethod === PaymentMethod.TRANSFERENCIA) {
      const validateTransferPayment = Validate.isRequiredBulk([
        {
          argument: command.data.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.cvu,
          argumentName: 'cvu',
        },
      ])

      if (!validateTransferPayment.success) {
        return Result.fail<string>(validateTransferPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.mpUser,
          argumentName: 'mpUser',
        },
        {
          argument: command.data.voucherNumber,
          argumentName: 'voucherNumber',
        },
        {
          argument: command.data.code,
          argumentName: 'code',
        },
        {
          argument: command.data.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.thirdParty,
          argumentName: 'thirdParty',
        },
      ])

      if (!guardAgainstPropertiesShouldNotExist.success) {
        return Result.fail<string>(guardAgainstPropertiesShouldNotExist.message)
      }
    }

    // VALIDATE CHEQUE PAYMENT

    if (paymentMethod === PaymentMethod.CHEQUE) {
      const validateCheckPayment = Validate.isRequiredBulk([
        { argument: command.data.code, argumentName: 'code' },
        {
          argument: command.data.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.thirdParty,
          argumentName: 'thirdParty',
        },
      ])

      if (!validateCheckPayment.success) {
        return Result.fail<string>(validateCheckPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.mpUser,
          argumentName: 'mpUser',
        },
        {
          argument: command.data.voucherNumber,
          argumentName: 'voucherNumber',
        },
        {
          argument: command.data.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.cvu,
          argumentName: 'cvu',
        },
      ])

      if (!guardAgainstPropertiesShouldNotExist.success) {
        return Result.fail<string>(guardAgainstPropertiesShouldNotExist.message)
      }
    }

    return Result.ok()
  }
}
