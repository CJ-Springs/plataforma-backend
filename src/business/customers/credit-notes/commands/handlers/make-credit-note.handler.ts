import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { CreditNote } from '../../aggregate/credit-note.aggregate'
import { CreditNoteRepository } from '../../repository/credit-note.repository'
import { MakeCreditNoteCommand } from '../impl/make-credit-note.command'
import { LoggerService } from '@/.shared/helpers/logger/logger.service'
import { Result, Validate } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { PrismaService } from '@/.shared/infra/prisma.service'

@CommandHandler(MakeCreditNoteCommand)
export class MakeCreditNoteHandler
  implements ICommandHandler<MakeCreditNoteCommand>
{
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
    private readonly creditNoteRepository: CreditNoteRepository,
  ) {}

  async execute(command: MakeCreditNoteCommand): Promise<StandardResponse> {
    this.logger.log(
      'Credit-Notes',
      'Ejecutando el MakeCreditNote command handler',
      { logType: 'command-handler' },
    )

    const validateCommand = this.validate(command)
    if (validateCommand.isFailure) {
      throw new BadRequestException(validateCommand.getErrorValue())
    }

    const { data } = command

    await this.prisma.customer
      .findUniqueOrThrow({
        where: { code: data.customerCode },
        select: { code: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `El cliente ${data.customerCode} no se ha encontrado`,
        )
      })

    const itemsMap = data.items.reduce(
      (acc, { productCode, returned, price }) => {
        if (acc.has(productCode)) {
          const prevProduct = acc.get(productCode)
          return acc.set(productCode, {
            returned: prevProduct.returned + returned,
            price: prevProduct.price ?? price,
          })
        }

        return acc.set(productCode, { returned, price })
      },
      new Map<string, { returned: number; price?: number }>(),
    )

    for await (const [code, { price }] of itemsMap) {
      const existingProduct = await this.prisma.product
        .findUniqueOrThrow({
          where: { code },
          select: {
            price: {
              select: {
                price: true,
              },
            },
          },
        })
        .catch(() => {
          throw new NotFoundException(`El producto ${code} no se ha encontrado`)
        })

      if (!price) {
        const prevItem = itemsMap.get(code)
        itemsMap.set(code, { ...prevItem, price: existingProduct.price.price })
      }
    }

    const creditNoteOrError = CreditNote.create({
      ...data,
      items: Array.from(itemsMap).map(([productCode, item]) => ({
        productCode,
        ...item,
      })),
    })
    if (creditNoteOrError.isFailure) {
      throw new BadRequestException(creditNoteOrError.getErrorValue())
    }
    const creditNote = creditNoteOrError.getValue()

    await this.creditNoteRepository.save(creditNote)
    this.publisher.mergeObjectContext(creditNote).commit()

    return {
      success: true,
      status: 201,
      message: `Nota de crédito hecha al cliente #${data.customerCode}`,
      data: creditNote.toDTO(),
    }
  }

  validate(command: MakeCreditNoteCommand) {
    const validation = Validate.isRequiredBulk([
      { argument: command.data.createdBy, argumentName: 'createdBy' },
      { argument: command.data.customerCode, argumentName: 'customerCode' },
      { argument: command.data.items, argumentName: 'items' },
    ])

    if (!validation.success) {
      return Result.fail<string>(validation.message)
    }

    return Result.ok()
  }
}
