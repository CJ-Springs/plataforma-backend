import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { PlaceSaleOrderCommand } from './commands/impl/place-sale-order.command'
import { PlaceSaleOrderDto } from './dtos'
import { UserDec } from '@/.shared/decorators'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'

@Controller('ventas')
export class SalesController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::crear-orden-venta')
  @UseGuards(PermissionGuard)
  @Post(':customerCode/nueva-orden')
  async placeSaleOrder(
    @Param('customerCode', ParseIntPipe) customerCode: number,
    @Body() saleOrder: PlaceSaleOrderDto,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new PlaceSaleOrderCommand({
        ...saleOrder,
        customerCode,
        createdBy: email,
      }),
    )
  }
}
