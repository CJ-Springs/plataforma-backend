import { InvoiceStatus, PaymentMethod } from '@prisma/client'
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { Cron, CronExpression } from '@nestjs/schedule'

import { EnterDepositDto } from './dtos'
import { DueInvoiceCommand } from './commands/impl/due-invoice.command'
import { AppendPaymentCommand } from './commands/impl/append-payment.command'
import { IncreaseBalanceCommand } from '../customers/commands/impl/increase-balance.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { DateTime, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { NotificationsService } from '@/notifications/notifications.service'
import {
  InvoicesDueTodayPayload,
  NovuEvent,
} from '@/notifications/novu-events.types'

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
    private readonly notification: NotificationsService,
  ) {}

  private async getCustomerPendingOrDueInvoices(customerCode: number) {
    await this.prisma.customer
      .findUniqueOrThrow({
        where: { code: customerCode },
        select: { code: true },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al cliente ${customerCode}`,
        )
      })

    return await this.prisma.invoice.findMany({
      where: {
        AND: [
          { order: { customerCode } },
          { status: { in: [InvoiceStatus.POR_PAGAR, InvoiceStatus.DEUDA] } },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  async enterDeposit(
    customerCode: number,
    deposit: EnterDepositDto,
    createdBy: string,
  ): Promise<StandardResponse> {
    const pendingInvoices = await this.getCustomerPendingOrDueInvoices(
      customerCode,
    )

    if (!pendingInvoices.length) {
      throw new ConflictException(
        `El cliente ${customerCode} tiene todas sus facturas al día`,
      )
    }

    let paymentAmount = deposit.amount

    for await (const invoice of pendingInvoices) {
      if (paymentAmount === 0) {
        break
      }

      const leftToPay = invoice.total - invoice.deposited

      if (paymentAmount >= leftToPay) {
        await this.commandBus.execute(
          new AppendPaymentCommand({
            ...deposit,
            amount: leftToPay,
            invoiceId: invoice.id,
            createdBy,
          }),
        )

        paymentAmount -= leftToPay
      } else {
        await this.commandBus.execute(
          new AppendPaymentCommand({
            ...deposit,
            amount: paymentAmount,
            invoiceId: invoice.id,
            createdBy,
          }),
        )

        paymentAmount = 0
      }
    }

    if (paymentAmount > 0) {
      await this.commandBus.execute(
        new IncreaseBalanceCommand({
          code: customerCode,
          increment: paymentAmount,
        }),
      )
    }

    return {
      success: true,
      status: 200,
      message: `Depósito del cliente ${customerCode} realizado correctamente. Monto abonado: $${
        deposit.amount
      }. Método de pago: ${deposit.paymentMethod
        .split('_')
        .join()
        .toLowerCase()}`,
    }
  }

  async usePaymentRemaining(
    customerCode: number,
    remaining: number,
    paymentInfo: {
      paymentMethod: PaymentMethod
      createdBy: string
      metadata?: Record<string, any>
    },
  ): Promise<StandardResponse> {
    const pendingInvoices = await this.getCustomerPendingOrDueInvoices(
      customerCode,
    )

    for await (const invoice of pendingInvoices) {
      if (remaining === 0) {
        break
      }

      const leftToPay = invoice.total - invoice.deposited

      if (remaining >= leftToPay) {
        await this.commandBus.execute(
          new AppendPaymentCommand({
            amount: leftToPay,
            invoiceId: invoice.id,
            paymentMethod: paymentInfo.paymentMethod,
            createdBy: paymentInfo.createdBy,
            ...paymentInfo.metadata,
          }),
        )

        remaining -= leftToPay
      } else {
        await this.commandBus.execute(
          new AppendPaymentCommand({
            amount: remaining,
            invoiceId: invoice.id,
            paymentMethod: paymentInfo.paymentMethod,
            createdBy: paymentInfo.createdBy,
            ...paymentInfo.metadata,
          }),
        )

        remaining = 0
      }
    }

    if (remaining > 0) {
      await this.commandBus.execute(
        new IncreaseBalanceCommand({
          code: customerCode,
          increment: remaining,
        }),
      )
    }

    return {
      success: true,
      status: 200,
      message: `Sobrante de monto $${remaining} de un pago realizado con ${paymentInfo.paymentMethod
        .split('_')
        .join()
        .toLowerCase()} utilizado para saldar facturas pendientes o incrementar el balance del usuario`,
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Mark unpaid expired invoices as due',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleDueInvoices() {
    this.logger.log(
      'Mark unpaid expired invoices as due',
      'Running schedule task',
    )
    const unpaidAndExpiredInvoices = await this.prisma.invoice.findMany({
      where: {
        AND: [
          { status: { equals: InvoiceStatus.POR_PAGAR } },
          { dueDate: { lt: new Date() } },
        ],
      },
    })

    for await (const invoice of unpaidAndExpiredInvoices) {
      await this.commandBus.execute(
        new DueInvoiceCommand({ invoiceId: invoice.id }),
      )
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'Send notification of invoices that due today',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleInvoicesDueToday() {
    this.logger.log(
      'Send notification of invoices that due today',
      'Running schedule task',
    )

    const today = DateTime.today()
    console.log({ today })

    const invoicesThatDueToday = await this.prisma.invoice.findMany({
      where: {
        AND: [
          { status: { equals: InvoiceStatus.POR_PAGAR } },
          { dueDate: { equals: today.date } },
        ],
      },
      select: {
        total: true,
        deposited: true,
        order: {
          select: {
            items: {
              select: {
                requested: true,
                price: true,
                discount: true,
                salePrice: true,
                product: {
                  select: {
                    brand: true,
                    model: true,
                  },
                },
              },
            },
            customer: {
              select: {
                name: true,
                code: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    })

    const groupInvoicesByCustomer = invoicesThatDueToday.reduce(
      (acc, { order, ...invoice }) => {
        const { code, ...customer } = order.customer

        if (acc.has(code)) {
          const customerInvoices = acc.get(code)

          return acc.set(code, {
            ...customerInvoices,
            invoices: [
              ...customerInvoices.invoices,
              {
                deposited: invoice.deposited,
                total: invoice.total,
                toPay: invoice.total - invoice.deposited,
                items: order.items.map((item) => ({
                  ...item,
                  productName: `${item.product.brand} ${item.product.model}`,
                })),
              },
            ],
          })
        }

        return acc.set(code, {
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerName: customer.name,
          invoices: [
            {
              deposited: invoice.deposited,
              total: invoice.total,
              toPay: invoice.total - invoice.deposited,
              items: order.items.map((item) => ({
                ...item,
                productName: `${item.product.brand} ${item.product.model}`,
              })),
            },
          ],
        })
      },
      new Map<
        number,
        Omit<
          InvoicesDueTodayPayload,
          'customerCode' | 'customerPendingInvoices'
        >
      >(),
    )

    for (const [code, data] of groupInvoicesByCustomer) {
      const notificationPayload: InvoicesDueTodayPayload = {
        ...data,
        customerCode: code,
        customerPendingInvoices: data.invoices.length,
      }

      this.notification.trigger(NovuEvent.INVOICES_DUE_TODAY, {
        to: {
          subscriberId: 'clivqlm380000z8wb6xi1hd8q',
          email: 'francomusolino55@gmail.com',
        },
        payload: notificationPayload as any,
      })
    }
  }
}
