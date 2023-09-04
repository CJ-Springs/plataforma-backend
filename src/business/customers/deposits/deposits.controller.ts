import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { EnterDepositDto } from './dtos'
import { EnterDepositCommand } from './commands/impl/enter-deposit.command'
import { CancelDepositCommand } from './commands/impl/cancel-deposit.command'
import { UserDec } from '@/.shared/decorators'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('clientes/:customerCode/depositos')
export class DepositsController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::ingresar-deposito')
  @UseGuards(PermissionGuard)
  @Post('ingresar-deposito')
  async enterDeposit(
    @Param('customerCode', ParseIntPipe) customerCode: number,
    @Body() deposit: EnterDepositDto,
    @UserDec('email') email: string,
  ) {
    const { amount, paymentMethod, ...metadata } = deposit
    const emptyMetadata = !Object.values(metadata).length

    return await this.commandBus.execute(
      new EnterDepositCommand({
        customerCode,
        createdBy: email,
        amount,
        paymentMethod,
        metadata: emptyMetadata ? undefined : metadata,
      }),
    )
  }

  @RequiredPermissions('backoffice::anular-deposito')
  @UseGuards(PermissionGuard)
  @Post(':depositId/anular-deposito')
  async cancelDeposit(
    @Param('depositId') depositId: string,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new CancelDepositCommand({
        depositId,
        canceledBy: email,
      }),
    )
  }
}
