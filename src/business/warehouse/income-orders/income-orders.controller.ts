import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { PlaceIncomeOrderCommand } from './commands/impl/place-income-order.command'
import { CancelIncomeOrderCommand } from './commands/impl/cancel-income-order.command'
import { PlaceIncomeOrderDto } from './dtos'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('ordenes-ingreso')
export class IncomeOrdersController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::crear-orden-ingreso')
  @UseGuards(PermissionGuard)
  @Post()
  async placeIncomeOrder(
    @Body() incomeOrder: PlaceIncomeOrderDto,
    @UserDec('id') userId: string,
  ) {
    return await this.commandBus.execute(
      new PlaceIncomeOrderCommand({ ...incomeOrder, userId }),
    )
  }

  @RequiredPermissions('backoffice::anular-orden-ingreso')
  @UseGuards(PermissionGuard)
  @Patch(':ID/anular-orden')
  async cancelIncomeOrder(@Param('ID') id: string) {
    return await this.commandBus.execute(
      new CancelIncomeOrderCommand({ orderId: id }),
    )
  }
}
