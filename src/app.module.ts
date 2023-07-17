import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { LoggerModule } from './.shared/helpers/logger/logger.module'
import { PrismaModule } from './.shared/infra/prisma.module'
import { AppController } from './app.controller'
import { AuthenticationModule } from './auth/authentication/authentication.module'
import { RolesModule } from './auth/authorization/roles/roles.module'
import { PermissionsModule } from './auth/authorization/permissions/permissions.module'
import { UsersModule } from './users/users.module'
import { JwtAuthGuard } from './auth/authentication/guards/jwt-auth.guard'
import { NotificationsModule } from './notifications/notifications.module'
import { CustomersModule } from './business/customers/customers.module'
import { ProductsModule } from './business/warehouse/products/products.module'
import { SpringsModule } from './business/warehouse/springs/springs.module'
import { IncomeOrdersModule } from './business/warehouse/income-orders/income-orders.module'
import { SalesModule } from './business/sales/sales.module'

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    AuthenticationModule,
    RolesModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PermissionsModule,
    UsersModule,
    NotificationsModule,
    CustomersModule,
    ProductsModule,
    SpringsModule,
    IncomeOrdersModule,
    SalesModule,
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
