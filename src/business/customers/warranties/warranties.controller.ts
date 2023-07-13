import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreateWarrantyOrderDto } from './dtos'
import { CreateWarrantyOrderCommand } from './commands/impl/create-warranty-order.command'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { UserDec } from '@/.shared/decorators'

@Controller('clientes/garantias')
export class WarrantiesController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::crear-orden-garantia')
  @UseGuards(PermissionGuard)
  @Post(':customerCode/nueva-garantia')
  async createWarrantyOrder(
    @Param('customerCode', ParseIntPipe) customerCode: number,
    @Body() warrantyOrder: CreateWarrantyOrderDto,
    @UserDec('email') email: string,
  ) {
    return await this.commandBus.execute(
      new CreateWarrantyOrderCommand({
        ...warrantyOrder,
        createdBy: email,
        customerCode,
      }),
    )
  }
}
