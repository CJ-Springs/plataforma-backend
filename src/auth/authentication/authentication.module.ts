import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy],
})
export class AuthenticationModule {}
