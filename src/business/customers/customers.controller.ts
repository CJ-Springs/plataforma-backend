import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { RegisterCustomerDto, UpdateCustomerDto } from './dtos'
import { RegisterCustomerCommand } from './commands/impl/register-customer.command'
import { UpdateCustomerCommand } from './commands/impl/update-customer.command'

@Controller('clientes')
export class CustomersController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::registrar-cliente')
  @UseGuards(PermissionGuard)
  @Post()
  async registerCustomer(@Body() newCustomer: RegisterCustomerDto) {
    return await this.commandBus.execute(
      new RegisterCustomerCommand(newCustomer),
    )
  }

  @RequiredPermissions('backoffice::actualizar-cliente')
  @UseGuards(PermissionGuard)
  @Patch(':code')
  async updateCustomer(
    @Param('code', ParseIntPipe) code: number,
    @Body() data: UpdateCustomerDto,
  ) {
    return await this.commandBus.execute(
      new UpdateCustomerCommand({ code, ...data }),
    )
  }
}
