import { InvoiceStatus } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { Invoice } from '../aggregate/invoice.aggregate'
import { InvoiceGeneratedEvent } from '../events/impl/invoice-generated.event'
import { InvoiceDuedEvent } from '../events/impl/invoice-dued.event'
import { IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class InvoiceRepository implements IRepository<Invoice> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Invoice>> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
      })

      if (!invoice) {
        return null
      }

      return Invoice.create(invoice)
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la factura ${id} en la db`,
      )
      return null
    }
  }

  async save(invoice: Invoice): Promise<void> {
    const events = invoice.getUncommittedEvents()

    await Promise.all(
      events.map((event) => {
        if (event instanceof InvoiceGeneratedEvent) {
          return this.generateInvoice(event.data)
        }
        if (event instanceof InvoiceDuedEvent) {
          return this.dueInvoice(event.data)
        }
      }),
    )
  }

  private async generateInvoice(data: InvoiceGeneratedEvent['data']) {
    try {
      await this.prisma.invoice.create({
        data,
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar crear la factura de la orden ${data.orderId} en la db`,
      )
    }
  }

  private async dueInvoice({ id }: InvoiceDuedEvent['data']) {
    try {
      await this.prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.DEUDA },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar vencer la factura ${id} en la db`,
      )
    }
  }
}
