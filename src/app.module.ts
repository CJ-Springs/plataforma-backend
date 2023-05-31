import { Module } from '@nestjs/common'
import { PrismaModule } from './.shared/infra/prisma.module'
import { AppController } from './app.controller'

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
