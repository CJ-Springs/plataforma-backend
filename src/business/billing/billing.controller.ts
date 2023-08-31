import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { EnterPaymentDto } from './dtos'
import { BillingService } from './billing.service'
import { AddPaymentCommand } from './commands/impl/add-payment.command'
import { CancelPaymentCommand } from './commands/impl/cancel-payment.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('facturacion')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly commandBus: CommandBus,
  ) {}

  @RequiredPermissions('backoffice::ingresar-pago')
  @UseGuards(PermissionGuard)
  @Post(':invoiceId/ingresar-pago')
  async addPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() payment: EnterPaymentDto,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new AddPaymentCommand({
        ...payment,
        invoiceId,
        createdBy: email,
      }),
    )
  }

  @RequiredPermissions('backoffice::anular-pago')
  @UseGuards(PermissionGuard)
  @Patch('anular-pago/:paymentId')
  async cancelPayment(
    @Param('paymentId') paymentId: string,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new CancelPaymentCommand({ paymentId, canceledBy: email }),
    )
  }
}
