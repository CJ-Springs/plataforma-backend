import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { UsersController } from './users.controller'
import { CommandHandlers } from './commands/handlers'
import { UserRepository } from './repository/user.repository'

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [UserRepository, ...CommandHandlers],
})
export class UsersModule {}
