import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { EnterPaymentDto } from './dtos'
import { EnterPaymentCommand } from './commands/impl/enter-payment.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('facturacion')
export class BillingController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::ingresar-pago')
  @UseGuards(PermissionGuard)
  @Post(':invoiceId/ingresar-pago')
  async enterPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() payment: EnterPaymentDto,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new EnterPaymentCommand({
        ...payment,
        invoiceId,
        createdBy: email,
      }),
    )
  }
}
