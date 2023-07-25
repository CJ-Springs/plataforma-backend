import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'

import { EnterPaymentDto } from './dtos'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('facturacion')
export class BillingController {
  @RequiredPermissions('backoffice::ingresar-pago')
  @UseGuards(PermissionGuard)
  @Post(':invoiceId/ingresar-pago')
  async enterPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() payment: EnterPaymentDto,
    @UserDec('email') email: string,
  ) {
    return { invoiceId, email, payment }
  }
}
