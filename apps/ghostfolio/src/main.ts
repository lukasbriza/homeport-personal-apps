import { ConsoleLogger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './filters'
import { getLoggerLevels } from './utils'

async function bootstrap() {
  const logger = new ConsoleLogger('DataImporter', {
    logLevels: getLoggerLevels(),
  })
  const app = await NestFactory.create(AppModule, {
    logger,
  })
  app.useLogger(logger)
  const config = app.get(ConfigService)
  const port = config.get<string>('PORT') || 3001

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJs Swagger')
    .setDescription('NestJs App API')
    .setVersion('1.0')
    .build()

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/swagger', app, document)
  }

  await app.listen(port)
  console.log(`App running on port: ${port}`)
}
// eslint-disable-next-line no-void
void bootstrap()
