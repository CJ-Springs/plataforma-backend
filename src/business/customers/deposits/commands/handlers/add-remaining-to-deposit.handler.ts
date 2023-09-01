import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'

import { DepositRepository } from '../../repository/deposit.repository'
import { AddRemainingToDepositCommand } from '../impl/add-remaining-to-deposit-remaining.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(AddRemainingToDepositCommand)
export class AddRemainingToDepositHandler
  implements ICommandHandler<AddRemainingToDepositCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly publisher: EventPublisher,
    private readonly depositRepository: DepositRepository,
  ) {}

  async execute(
    command: AddRemainingToDepositCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Customers/Deposits',
      'Ejecutando el AddRemainingToDeposit command handler',
      {
        logType: 'command-handler',
      },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const {
      data: { depositId, addition },
    } = command

    const depositOrNull = await this.depositRepository.findOneById(depositId)
    if (!depositOrNull) {
      throw new NotFoundException(
        `No se ha encontrado el depósito con id ${depositId}`,
      )
    }
    const deposit = depositOrNull.getValue()

    const addToRemainingResult = deposit.addToRemaining(addition)
    if (addToRemainingResult.isFailure) {
      throw new BadRequestException(addToRemainingResult.getErrorValue())
    }

    await this.depositRepository.save(deposit)
    this.publisher.mergeObjectContext(deposit).commit()

    return {
      success: true,
      status: 200,
      message: `Sobrante del depósito ${depositId} actualizado a ${deposit.props.remaining.getFormattedMoney()}`,
    }
  }

  validate(command: AddRemainingToDepositCommand) {
    const validation = Validate.isRequiredBulk([
      {
        argument: command.data.depositId,
        argumentName: 'depositId',
      },
      {
        argument: command.data.addition,
        argumentName: 'addition',
      },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
