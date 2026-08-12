import { IoAdapter } from '@nestjs/platform-socket.io'
import type { INestApplicationContext } from '@nestjs/common'
import type { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import type { AppConfigService } from '../config/app-config.service.js'

/**
 * Fans Socket.IO broadcasts out across multiple API instances via Redis
 * pub/sub. Without this, a broadcast from instance A never reaches a
 * client connected to instance B — fine for a single dev process, a
 * correctness bug the moment we run >1 API replica in production.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>

  constructor(private readonly app: INestApplicationContext) {
    super(app)
  }

  async connectToRedis(config: AppConfigService): Promise<void> {
    const url = config.redis.password
      ? `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`
      : `redis://${config.redis.host}:${config.redis.port}`

    const pubClient = createClient({ url })
    const subClient = pubClient.duplicate()
    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options)
    if (this.adapterConstructor) server.adapter(this.adapterConstructor)
    return server
  }
}
