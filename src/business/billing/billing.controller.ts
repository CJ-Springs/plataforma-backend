import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { EnterDepositDto, EnterPaymentDto } from './dtos'
import { BillingService } from './billing.service'
import { EnterPaymentCommand } from './commands/impl/enter-payment.command'
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

  @RequiredPermissions('backoffice::ingresar-deposito')
  @UseGuards(PermissionGuard)
  @Post(':customerCode/ingresar-deposito')
  async enterDeposit(
    @Param('customerCode', ParseIntPipe) customerCode: number,
    @Body() deposit: EnterDepositDto,
    @UserDec('email') email: string,
  ) {
    return await this.billingService.enterDeposit(customerCode, deposit, email)
  }
}
