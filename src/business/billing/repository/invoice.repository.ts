import { InvoiceStatus, PaymentStatus, Prisma } from '@prisma/client'
import { Injectable } from '@nestjs/common'

import { Invoice } from '../aggregate/invoice.aggregate'
import { InvoiceGeneratedEvent } from '../events/impl/invoice-generated.event'
import { InvoiceDuedEvent } from '../events/impl/invoice-dued.event'
import { PaymentAddedEvent } from '../events/impl/payment-added.event'
import { PaymentCanceledEvent } from '../events/impl/payment-canceled.event'
import { PaymentAmountReducedEvent } from '../events/impl/payment-amount-reduced.event'
import { IFindByInput, IRepository } from '@/.shared/types'
import { LoggerService, Result } from '@/.shared/helpers'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Injectable()
export class InvoiceRepository
  implements IRepository<Invoice>, IFindByInput<Invoice>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findOneById(id: string): Promise<Result<Invoice>> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          payments: true,
        },
      })

      if (!invoice) {
        return null
      }

      const { payments, ...props } = invoice

      return Invoice.create({
        ...props,
        payments: payments.map((payment) => ({
          ...payment,
          metadata: payment.metadata as object,
        })),
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la factura ${id} en la db`,
      )
      return null
    }
  }

  async findOneByInput(
    where: Prisma.InvoiceWhereInput,
  ): Promise<Result<Invoice>> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where,
        include: {
          payments: true,
        },
      })

      if (!invoice) {
        return null
      }

      const { payments, ...props } = invoice

      return Invoice.create({
        ...props,
        payments: payments.map((payment) => ({
          ...payment,
          metadata: payment.metadata as object,
        })),
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar buscar la factura ${JSON.stringify(where)} en la db`,
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
        if (event instanceof PaymentAddedEvent) {
          return this.addPayment(event.data)
        }
        if (event instanceof PaymentCanceledEvent) {
          return this.cancelPayment(event.data)
        }
        if (event instanceof PaymentAmountReducedEvent) {
          return this.reducePaymentAmount(event.data)
        }
      }),
    )
  }

  private async generateInvoice(data: InvoiceGeneratedEvent['data']) {
    const { payments, ...invoice } = data
    console.log({ invoice })

    try {
      await this.prisma.invoice.create({
        data: {
          ...invoice,
          payments: {
            createMany: {
              data: payments.map((payment) => ({
                ...payment,
                metadata: payment.metadata,
              })),
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar generar la factura de la orden ${data.orderId} en la db`,
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

  private async addPayment(data: PaymentAddedEvent['data']) {
    const { invoiceId: id, status, payment } = data
    console.log({ payment })

    try {
      await this.prisma.invoice.update({
        where: { id },
        data: {
          status,
          deposited: {
            increment: payment.amount - payment.remaining,
          },
          payments: {
            create: {
              ...payment,
              metadata: payment.metadata,
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar agregar un pago a la factura ${id} en la db`,
      )
    }
  }

  private async cancelPayment(data: PaymentCanceledEvent['data']) {
    const { invoiceId: id, status, payment } = data

    try {
      await this.prisma.invoice.update({
        where: { id },
        data: {
          status,
          deposited: {
            decrement: payment.amount - payment.remaining,
          },
          payments: {
            update: {
              where: {
                id: payment.id,
              },
              data: {
                status: PaymentStatus.ANULADO,
                canceledBy: payment.canceledBy,
              },
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar cancelar el pago ${payment.id} de la factura ${id} en la db`,
      )
    }
  }

  private async reducePaymentAmount(data: PaymentAmountReducedEvent['data']) {
    const { invoiceId: id, status, payment } = data

    try {
      await this.prisma.invoice.update({
        where: { id },
        data: {
          status,
          deposited: {
            decrement: payment.reduction,
          },
          payments: {
            update: {
              where: {
                id: payment.id,
              },
              data: {
                amount: {
                  decrement: payment.reduction,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      this.logger.error(
        error,
        `Error al intentar reducir el monto del pago ${payment.id} de la factura ${id} en la db`,
      )
    }
  }
}
