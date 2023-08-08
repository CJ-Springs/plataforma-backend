import { TechnicalSheetType } from '@prisma/client'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { AttachTechnicalSheetCommand } from '../impl/attach-technical-sheet.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(AttachTechnicalSheetCommand)
export class AttachTechnicalSheetHandler
  implements ICommandHandler<AttachTechnicalSheetCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: AttachTechnicalSheetCommand,
  ): Promise<StandardResponse> {
    this.logger.log(
      'Springs',
      'Ejecutando el AttachTechnicalSheet command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command
    const { code, ...technicalSheet } = data

    const existingSpring = await this.prisma.spring.findUnique({
      where: { code },
      select: { id: true, technicalSheet: true },
    })
    if (!existingSpring) {
      throw new NotFoundException(`El espiral ${code} no existe`)
    }
    if (existingSpring.technicalSheet) {
      throw new ConflictException(
        `El espiral ${code} ya posee una hoja técnicna`,
      )
    }

    try {
      await this.prisma.technicalSheet.create({
        data: {
          ...technicalSheet,
          springId: existingSpring.id,
        },
      })
    } catch (error) {
      this.logger.error(error, `Al crear la ficha técnica del espiral ${code}`)
      throw new BadRequestException(
        `Error durante la creación de la ficha técnica para el espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Ficha técnica adjuntada al espiral ${code}`,
    }
  }

  validate(command: AttachTechnicalSheetCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.type, argumentName: 'type' },
      { argument: command.data.weight, argumentName: 'weight' },
      { argument: command.data.height, argumentName: 'height' },
      { argument: command.data.wireThickness, argumentName: 'wireThickness' },
      { argument: command.data.amountOfLaps, argumentName: 'amountOfLaps' },
      {
        argument: command.data.lightBetweenBases,
        argumentName: 'lightBetweenBases',
      },
      { argument: command.data.innerCore, argumentName: 'innerCore' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    if (command.data.type === TechnicalSheetType.TRABA_OJAL) {
      const typeValidation = Validate.isRequiredBulk([
        {
          argument: command.data.lightBetweenBasesTwo,
          argumentName: 'lightBetweenBasesTwo',
        },
        { argument: command.data.innerBases, argumentName: 'innerBases' },
      ])

      if (!typeValidation.success) {
        return Result.fail<string>(typeValidation.message)
      }
    }

    if (command.data.type === TechnicalSheetType.OJAL_OJAL) {
      const typeValidation = Validate.isRequiredBulk([
        {
          argument: command.data.lightBetweenBasesTwo,
          argumentName: 'lightBetweenBasesTwo',
        },
        { argument: command.data.innerBases, argumentName: 'innerBases' },
        { argument: command.data.innerBasesTwo, argumentName: 'innerBasesTwo' },
      ])

      if (!typeValidation.success) {
        return Result.fail<string>(typeValidation.message)
      }
    }

    return Result.ok()
  }
}
