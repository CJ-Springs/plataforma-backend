import { Body, Controller, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'

import { CreateUserDto } from './dtos'
import { CreateUserCommand } from './commands/impl/create-user.command'

@Controller('usuarios')
export class UsersController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    const { email, document, firstname, phone, lastname } = data

    return await this.commandBus.execute(
      new CreateUserCommand({
        email,
        document,
        firstname,
        lastname,
        phone,
        role: data?.role,
      }),
    )
  }
}
