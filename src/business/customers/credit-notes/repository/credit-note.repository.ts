import { Injectable } from '@nestjs/common'

import { CreditNote } from '../aggregate/credit-note.aggregate'
import { CreditNoteMadeEvent } from '../events/impl/credit-note-made.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class CreditNoteRepository implements IRepository<CreditNote> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<CreditNote>> {
    try {
      const creditNote = await this.prisma.creditNote.findUnique({
        where: { id },
        include: {
          items: true,
        },
      })

      if (!creditNote) {
        return null
      }

      return CreditNote.create(creditNote)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la nota de crédito ${id} en la db`,
      )
      return null
    }
  }

  async save(creditNote: CreditNote): Promise<void> {
    const events = creditNote.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof CreditNoteMadeEvent) {
          return this.makeCreditNote(event.data)
        }
      }),
    )
  }

  private async makeCreditNote(data: CreditNoteMadeEvent['data']) {
    const { items, ...creditNote } = data

    try {
      await this.prisma.creditNote.create({
        data: { ...creditNote, items: { createMany: { data: items } } },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear la nota de crédito ${data.id} en la db`,
      )
    }
  }
}
