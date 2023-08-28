import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import * as morgan from 'morgan'
import helmet from 'helmet'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './.shared/filters'

const PORT = process.env.PORT || 3000

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(morgan('tiny'))
  app.use(helmet())

  app.useGlobalFilters(new HttpExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  await app.listen(PORT)
}
bootstrap()
