import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { Injectable, NotFoundException } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { Cron, CronExpression } from '@nestjs/schedule'

import { DueInvoiceCommand } from './commands/impl/due-invoice.command'
import { AddPaymentCommand } from './commands/impl/add-payment.command'
import { CancelPaymentCommand } from './commands/impl/cancel-payment.command'
import { ReducePaymentAmountCommand } from './commands/impl/reduce-payment-amount.command'
import { PrismaService } from '@/.shared/infra/prisma.service'
import { DateTime, LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'
import { NotificationsService } from '@/notifications/notifications.service'
import {
  InvoicesDueTodayNotificationPayload,
  NovuEvent,
} from '@/notifications/novu-events.types'
import { formatMoney } from '@/.shared/utils'

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

  async payBulkInvoices(
    customerCode: number,
    paymentInfo: {
      amount: number
      paymentMethod: PaymentMethod
      createdBy: string
      depositId?: string
      metadata?: Record<string, any>
    },
  ): Promise<StandardResponse<{ remaining: number | null }>> {
    this.logger.log('Billing', 'Ejecutando el método payBulkInvoices', {
      logType: 'service',
    })

    const pendingInvoices = await this.getCustomerPendingOrDueInvoices(
      customerCode,
    )

    let availableAmount = paymentInfo.amount

    for await (const invoice of pendingInvoices) {
      if (availableAmount === 0) {
        break
      }

      const leftToPay = invoice.total - invoice.deposited

      if (availableAmount >= leftToPay) {
        await this.commandBus.execute(
          new AddPaymentCommand({
            ...paymentInfo,
            amount: leftToPay,
            invoiceId: invoice.id,
          }),
        )

        availableAmount -= leftToPay
      } else {
        await this.commandBus.execute(
          new AddPaymentCommand({
            ...paymentInfo,
            amount: availableAmount,
            invoiceId: invoice.id,
          }),
        )

        availableAmount = 0
      }
    }

    return {
      success: true,
      status: 200,
      message: '',
      data: {
        remaining: availableAmount > 0 ? availableAmount : null,
      },
    }
  }

  async onPaymentOrDepositWithRemainingCanceled(
    customerCode: number,
    remaining: number,
    canceledBy: string,
  ): Promise<StandardResponse<{ remaining: number | null }>> {
    this.logger.log(
      'Billing',
      'Ejecutando el método onPaymentOrDepositWithRemainingCanceled',
      {
        logType: 'service',
      },
    )

    let paymentRemaining = remaining

    do {
      if (paymentRemaining <= 0) break

      const payment = await this.prisma.payment.findFirst({
        where: {
          AND: [
            {
              paymentMethod: PaymentMethod.SALDO_A_FAVOR,
              status: PaymentStatus.ABONADO,
              invoice: {
                order: { customerCode: { equals: customerCode } },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      console.log({ payment })

      if (!payment) break

      if (payment.amount > paymentRemaining) {
        await this.commandBus.execute(
          new ReducePaymentAmountCommand({
            paymentId: payment.id,
            reduction: paymentRemaining,
          }),
        )

        paymentRemaining = 0
        break
      } else {
        await this.commandBus.execute(
          new CancelPaymentCommand({
            paymentId: payment.id,
            canceledBy,
          }),
        )

        paymentRemaining -= payment.amount
      }
    } while (paymentRemaining > 0)

    return {
      success: true,
      status: 200,
      message: '',
      data: {
        remaining: paymentRemaining > 0 ? paymentRemaining : null,
      },
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Mark unpaid expired invoices as due',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleDueInvoices() {
    this.logger.log('Billing', 'Mark unpaid expired invoices as due', {
      logType: 'schedule-task',
    })

    const today = DateTime.today()

    const unpaidAndExpiredInvoices = await this.prisma.invoice.findMany({
      where: {
        AND: [
          { status: { equals: InvoiceStatus.POR_PAGAR } },
          { dueDate: { lt: today.getDate() } },
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
    this.logger.log('Billing', 'Send notification of invoices that due today', {
      logType: 'schedule-task',
    })

    const today = DateTime.today()

    const invoicesThatDueToday = await this.prisma.invoice.findMany({
      where: {
        AND: [
          { status: { equals: InvoiceStatus.POR_PAGAR } },
          { dueDate: { equals: today.getDate() } },
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
                order: `${customerInvoices.invoices.length + 1})`,
                deposited: formatMoney(invoice.deposited),
                total: formatMoney(invoice.total),
                toPay: formatMoney(invoice.total - invoice.deposited),
                items: order.items.map((item) => ({
                  ...item,
                  price: formatMoney(item.price),
                  salePrice: formatMoney(item.salePrice),
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
              order: '1)',
              deposited: formatMoney(invoice.deposited),
              total: formatMoney(invoice.total),
              toPay: formatMoney(invoice.total - invoice.deposited),
              items: order.items.map((item) => ({
                ...item,
                price: formatMoney(item.price),
                salePrice: formatMoney(item.salePrice),
                productName: `${item.product.brand} ${item.product.model}`,
              })),
            },
          ],
        })
      },
      new Map<
        number,
        Omit<
          InvoicesDueTodayNotificationPayload,
          'customerCode' | 'customerPendingInvoices'
        >
      >(),
    )

    for (const [code, data] of groupInvoicesByCustomer) {
      const notificationPayload: InvoicesDueTodayNotificationPayload = {
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
