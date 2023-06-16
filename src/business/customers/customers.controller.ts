import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { RegisterCustomerDto } from './dtos'
import { RegisterCustomerCommand } from './commands/impl/register-customer.command'

@Controller('clientes')
export class CustomersController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::registrar-cliente')
  @UseGuards(PermissionGuard)
  @Post()
  async registerCustomer(@Body() newCustomer: RegisterCustomerDto) {
    const { address, city, locality, province, country, ...customer } =
      newCustomer

    return await this.commandBus.execute(
      new RegisterCustomerCommand({
        ...customer,
        address: {
          country,
          province,
          city,
          locality,
          address,
        },
      }),
    )
  }
}
