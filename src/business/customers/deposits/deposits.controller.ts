import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'

import { UserDec } from '@/.shared/decorators'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { CommandBus } from '@nestjs/cqrs'
import { EnterDepositCommand } from './commands/impl/enter-deposit.command'
import { EnterDepositDto } from './dtos'

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
    return await this.commandBus.execute(
      new EnterDepositCommand({ ...deposit, customerCode, createdBy: email }),
    )
  }
}
