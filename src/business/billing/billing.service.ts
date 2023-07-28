import { InvoiceStatus } from '@prisma/client'
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
import { LoggerService } from '@/.shared/helpers'
import { StandardResponse } from '@/.shared/types'

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async enterDeposit(
    customerCode: number,
    deposit: EnterDepositDto,
    createdBy: string,
  ): Promise<StandardResponse> {
    await this.prisma.customer
      .findUniqueOrThrow({
        where: { code: customerCode },
        select: {
          balance: true,
        },
      })
      .catch(() => {
        throw new NotFoundException(
          `No se ha encontrado al cliente ${customerCode}`,
        )
      })

    const pendingInvoices = await this.prisma.invoice.findMany({
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Mark unpaid expired invoices as due',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async handleCron() {
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
}
