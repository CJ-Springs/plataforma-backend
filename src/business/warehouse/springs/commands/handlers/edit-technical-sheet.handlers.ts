import { TechnicalSheetType } from '@prisma/client'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { EditTechnicalSheetCommand } from '../impl/edit-technical-sheet.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { StandardResponse } from '@/.shared/types'

@CommandHandler(EditTechnicalSheetCommand)
export class EditTechnicalSheetHandler
  implements ICommandHandler<EditTechnicalSheetCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: EditTechnicalSheetCommand): Promise<StandardResponse> {
    this.logger.log(
      'Springs',
      'Ejecutando el EditTechnicalSheet command handler',
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
    if (!existingSpring.technicalSheet) {
      throw new ConflictException(
        `El espiral ${code} no posee una hoja técnicna`,
      )
    }
    if (existingSpring.technicalSheet.type !== technicalSheet.type) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de espiral. El tipo del espiral ${code} es ${existingSpring.technicalSheet.type}`,
      )
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type, ...fieldsToUpdate } = technicalSheet

      await this.prisma.technicalSheet.update({
        where: {
          springId: existingSpring.id,
        },
        data: {
          ...fieldsToUpdate,
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Al actualizar la ficha técnica del espiral ${code}`,
      )
      throw new BadRequestException(
        `Error durante la actualización de la ficha técnica para el espiral ${code}`,
      )
    }

    return {
      success: true,
      status: 200,
      message: `Ficha técnica del espiral ${code} actualizada correctamente`,
    }
  }

  validate(command: EditTechnicalSheetCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.code, argumentName: 'code' },
      { argument: command.data.type, argumentName: 'type' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    if (command.data.type === TechnicalSheetType.TRABA_TRABA) {
      const typeValidation = Validate.shouldNotExistBulk([
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

    if (command.data.type === TechnicalSheetType.TRABA_OJAL) {
      const typeValidation = Validate.shouldNotExist(
        command.data.innerBasesTwo,
        'innerBasesTwo',
      )

      if (!typeValidation.success) {
        return Result.fail<string>(typeValidation.message)
      }
    }

    return Result.ok()
  }
}
