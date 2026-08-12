import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service.js'
import { Public } from '../modules/auth/decorators/public.decorator.js'

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<{ status: string; db: 'up' | 'down'; ts: string }> {
    let db: 'up' | 'down' = 'down'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      db = 'up'
    } catch {
      db = 'down'
    }
    return { status: 'ok', db, ts: new Date().toISOString() }
  }
}
