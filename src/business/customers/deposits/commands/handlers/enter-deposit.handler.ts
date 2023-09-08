import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { Deposit } from '../../aggregate/deposit.aggregate'
import { DepositRepository } from '../../repository/deposit.repository'
import { EnterDepositCommand } from '../impl/enter-deposit.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { formatConstantValue } from '@/.shared/utils'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(EnterDepositCommand)
export class EnterDepositHandler
  implements ICommandHandler<EnterDepositCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly prisma: PrismaService,
    private readonly depositRepository: DepositRepository,
  ) {}

  async execute(command: EnterDepositCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers/Deposits',
      'Ejecutando el EnterDeposit command handler',
      {
        logType: 'command-handler',
      },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { customerCode, ...props },
    } = command

    await this.prisma.customer
      .findUniqueOrThrow({ where: { code: customerCode } })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al cliente #${customerCode}`,
        )
      })
    await this.prisma.invoice
      .findFirstOrThrow({
        where: {
          AND: [
            { order: { customerCode } },
            { status: { in: [InvoiceStatus.POR_PAGAR, InvoiceStatus.DEUDA] } },
          ],
        },
      })
      .catch(() => {
        throw new ConflictException(
          `El cliente #${customerCode} no tiene facturas pendientes de pago`,
        )
      })

    const depositOrError = Deposit.create({
      ...props,
      status: PaymentStatus.ABONADO,
      customerCode,
    })
    if (depositOrError.isFailure) {
      throw new BadRequestException(depositOrError.getErrorValue())
    }
    const deposit = depositOrError.getValue()

    await this.depositRepository.save(deposit)
    this.publisher.mergeObjectContext(deposit).commit()

    return {
      success: true,
      status: 201,
      message: `Depósito realizado con ${formatConstantValue(
        deposit.props.paymentMethod,
      )} de monto ${deposit.props.amount.getFormattedMoney()} ingresado al cliente #${customerCode}`,
      data: deposit.toDTO(),
    }
  }

  validate(command: EnterDepositCommand) {
    const validation = Validate.isRequiredBulk([
      {
        argument: command.data.customerCode,
        argumentName: 'customerCode',
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
      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExist(
        command.data.metadata,
        'metadata',
      )

      if (!guardAgainstPropertiesShouldNotExist.success) {
        return Result.fail<string>(guardAgainstPropertiesShouldNotExist.message)
      }
    }

    // VALIDATE MERCADO PAGO PAYMENT

    if (paymentMethod === PaymentMethod.MERCADO_PAGO) {
      const validateMpPayment = Validate.isRequiredBulk([
        { argument: command.data.metadata, argumentName: 'metadata' },
        { argument: command.data.metadata.mpUser, argumentName: 'mpUser' },
        {
          argument: command.data.metadata.voucherNumber,
          argumentName: 'voucherNumber',
        },
      ])

      if (!validateMpPayment.success) {
        return Result.fail<string>(validateMpPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.metadata.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.metadata.cvu,
          argumentName: 'cvu',
        },
        {
          argument: command.data.metadata.code,
          argumentName: 'code',
        },
        {
          argument: command.data.metadata.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.metadata.thirdParty,
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
          argument: command.data.metadata,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.metadata.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.metadata.cvu,
          argumentName: 'cvu',
        },
      ])

      if (!validateTransferPayment.success) {
        return Result.fail<string>(validateTransferPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.metadata.mpUser,
          argumentName: 'mpUser',
        },
        {
          argument: command.data.metadata.voucherNumber,
          argumentName: 'voucherNumber',
        },
        {
          argument: command.data.metadata.code,
          argumentName: 'code',
        },
        {
          argument: command.data.metadata.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.metadata.thirdParty,
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
        { argument: command.data.metadata, argumentName: 'metadata' },
        { argument: command.data.metadata.code, argumentName: 'code' },
        {
          argument: command.data.metadata.paymentDate,
          argumentName: 'paymentDate',
        },
        {
          argument: command.data.metadata.thirdParty,
          argumentName: 'thirdParty',
        },
      ])

      if (!validateCheckPayment.success) {
        return Result.fail<string>(validateCheckPayment.message)
      }

      const guardAgainstPropertiesShouldNotExist = Validate.shouldNotExistBulk([
        {
          argument: command.data.metadata.mpUser,
          argumentName: 'mpUser',
        },
        {
          argument: command.data.metadata.voucherNumber,
          argumentName: 'voucherNumber',
        },
        {
          argument: command.data.metadata.operationNumber,
          argumentName: 'operationNumber',
        },
        {
          argument: command.data.metadata.cvu,
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
