import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module.js'
import { AppConfigService } from './common/config/app-config.service.js'
import { RedisIoAdapter } from './common/redis/redis-io.adapter.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get(AppConfigService)

  // Logging
  app.useLogger(app.get(Logger))

  // Security headers
  app.use(helmet())
  app.use(cookieParser())

  // CORS
  app.enableCors({
    origin: [config.adminOrigin, config.trackingOrigin, config.scanOrigin],
    credentials: true,
  })

  // WebSocket: fan out broadcasts across instances via Redis pub/sub
  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis(config)
  app.useWebSocketAdapter(redisIoAdapter)

  // Graceful shutdown for Prisma + BullMQ
  app.enableShutdownHooks()

  // API prefix
  app.setGlobalPrefix('api', { exclude: ['/health'] })

  await app.listen(config.port)
  const logger = app.get(Logger)
  logger.log(`🚀 GSGLOGISTIQUE API listening on http://localhost:${config.port}`, 'Bootstrap')
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap API', err)
  process.exit(1)
})
