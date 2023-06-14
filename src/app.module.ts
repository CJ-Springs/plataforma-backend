import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'

import { LoggerModule } from './.shared/helpers/logger/logger.module'
import { PrismaModule } from './.shared/infra/prisma.module'
import { AppController } from './app.controller'
import { AuthenticationModule } from './auth/authentication/authentication.module'
import { RolesModule } from './auth/authorization/roles/roles.module'
import { PermissionsModule } from './auth/authorization/permissions/permissions.module'
import { UsersModule } from './users/users.module'
import { JwtAuthGuard } from './auth/authentication/guards/jwt-auth.guard'

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    AuthenticationModule,
    RolesModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PermissionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
