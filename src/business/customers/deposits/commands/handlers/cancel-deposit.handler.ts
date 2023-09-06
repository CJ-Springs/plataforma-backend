import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { DepositRepository } from '../../repository/deposit.repository'
import { CancelDepositCommand } from '../impl/cancel-deposit.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(CancelDepositCommand)
export class CancelDepositHandler
  implements ICommandHandler<CancelDepositCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly depositRepository: DepositRepository,
  ) {}

  async execute(command: CancelDepositCommand): Promise<StandardResponse> {
    this.logger.log(
      'Customers/Deposits',
      'Ejecutando el CancelDeposit command handler',
      {
        logType: 'command-handler',
      },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { depositId, canceledBy },
    } = command

    const depositOrNull = await this.depositRepository.findOneById(depositId)
    if (!depositOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el depósito con id ${depositId}`,
      )
    }
    const deposit = depositOrNull.getValue()

    const cancelDepositResult = deposit.cancel(canceledBy)
    if (cancelDepositResult.isFailure) {
      throw new BadRequestException(cancelDepositResult.getErrorValue())
    }

    await this.depositRepository.save(deposit)
    this.publisher.mergeObjectContext(deposit).commit()

    return {
      success: true,
      status: 200,
      message: `El depósito ${depositId} ha sido anulado`,
    }
  }

  validate(command: CancelDepositCommand) {
    const validation = Validate.isRequiredBulk([
      {
        argument: command.data.depositId,
        argumentName: 'depositId',
      },
      {
        argument: command.data.canceledBy,
        argumentName: 'canceledBy',
      },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
