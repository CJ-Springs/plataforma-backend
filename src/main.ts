import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './.shared/filters'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalFilters(new HttpExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )

  await app.listen(3000)
}
bootstrap()
