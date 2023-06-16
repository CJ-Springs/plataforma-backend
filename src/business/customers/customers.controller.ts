import { Body, Controller, Post, UseGuards } from '@nestjs/common'

import { RegisterCustomerDto } from './dtos'
import {
  PermissionGuard,
  RequiredPermissions,
} from '@/auth/authorization/guards'
import { CommandBus } from '@nestjs/cqrs'
import { RegisterCustomerCommand } from './commands/impl/register-customer.command'

@Controller('clientes')
export class CustomersController {
  constructor(private readonly commandBus: CommandBus) {}

  @RequiredPermissions('backoffice::registrar-cliente')
  @UseGuards(PermissionGuard)
  @Post()
  async registerCustomer(@Body() newCustomer: RegisterCustomerDto) {
    const {
      name,
      code,
      address,
      city,
      cuil,
      email,
      locality,
      paymentDeadline,
      phone,
      province,
      discount,
    } = newCustomer

    return await this.commandBus.execute(
      new RegisterCustomerCommand({
        name,
        code,
        email,
        cuil,
        phone,
        discount,
        paymentDeadline,
        address: {
          province,
          city,
          locality,
          address,
        },
      }),
    )
  }
}
