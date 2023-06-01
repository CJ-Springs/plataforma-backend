import { Module } from '@nestjs/common'

import { LoggerModule } from './.shared/helpers/logger/logger.module'
import { PrismaModule } from './.shared/infra/prisma.module'
import { AppController } from './app.controller'
import { AuthenticationModule } from './auth/authentication/authentication.module'
import { RolesModule } from './auth/authorization/roles/roles.module'

@Module({
  imports: [PrismaModule, LoggerModule, AuthenticationModule, RolesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
