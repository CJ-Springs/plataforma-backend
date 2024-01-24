import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import * as morgan from 'morgan'
import * as path from 'path'
import helmet from 'helmet'
import { writeFileSync } from 'fs'

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

  const configService = app.get(ConfigService)
  writeFileSync(
    path.join(process.cwd(), 'prisma/ca-certificate.cer'),
    configService.get('SSL_CERTIFICATE') ?? '',
  )

  await app.listen(PORT)
}
bootstrap()
