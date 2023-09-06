import { PaymentMethod } from '@prisma/client'
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { EnterPaymentDto } from './dtos'
import { AddPaymentCommand } from './commands/impl/add-payment.command'
import { PaymentWithCustomerBalanceCommand } from './commands/impl/payment-with-customer-balance.command'
import { CancelPaymentCommand } from './commands/impl/cancel-payment.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'
import { PrismaService } from '@/.shared/infra/prisma.service'

@Controller('facturacion')
export class BillingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @RequiredPermissions('backoffice::ingresar-pago')
  @UseGuards(PermissionGuard)
  @Post(':invoiceId/ingresar-pago')
  async addPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() payment: EnterPaymentDto,
    @UserDec('email') email: string,
  ) {
    const { amount, paymentMethod, ...metadata } = payment
    const emptyMetadata = !Object.values(metadata).length

    return await this.commandBus.execute(
      new AddPaymentCommand({
        invoiceId,
        createdBy: email,
        amount,
        paymentMethod,
        metadata: emptyMetadata ? undefined : metadata,
      }),
    )
  }

  @RequiredPermissions('backoffice::ingresar-pago')
  @UseGuards(PermissionGuard)
  @Post(':invoiceId/usar-balance-cliente')
  async useCustomerBalance(
    @Param('invoiceId') invoiceId: string,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new PaymentWithCustomerBalanceCommand({ invoiceId, createdBy: email }),
    )
  }

  @RequiredPermissions('backoffice::anular-pago')
  @UseGuards(PermissionGuard)
  @Patch('anular-pago/:paymentId')
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @UserDec('email') email: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (payment && payment.depositId) {
      throw new BadRequestException(
        'El pago fue realizado a partir de un depósito, por lo que no se puede cancelar de manera individual',
      )
    }
    if (payment && payment.paymentMethod === PaymentMethod.SALDO_A_FAVOR) {
      throw new BadRequestException(
        'No es posible anular un pago realizado a partir del saldo a favor del cliente',
      )
    }

    return await this.commandBus.execute(
      new CancelPaymentCommand({ paymentId, canceledBy: email }),
    )
  }
}
