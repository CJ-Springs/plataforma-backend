import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { UsersController } from './users.controller'
import { CommandHandlers } from './commands/handlers'
import { UserRepository } from './repository/user.repository'
import { RolesModule } from '@/auth/authorization/roles/roles.module'
import { UsersService } from './users.service'

@Module({
  imports: [CqrsModule, RolesModule],
  controllers: [UsersController],
  providers: [UserRepository, UsersService, ...CommandHandlers],
})
export class UsersModule {}
