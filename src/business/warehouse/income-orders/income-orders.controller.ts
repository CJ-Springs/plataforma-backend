import { Controller, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { PlaceIncomeOrderCommand } from './commands/impl/place-income-order.command'
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
  async placeIncomeOrder(@UserDec('id') userId: string) {
    return await this.commandBus.execute(
      new PlaceIncomeOrderCommand({ userId }),
    )
  }
}
