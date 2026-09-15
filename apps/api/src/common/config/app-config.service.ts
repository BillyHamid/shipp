import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1),

  // Hosting platforms (Railway, Render, ...) typically inject a single
  // connection string instead of separate host/port/password. When present,
  // REDIS_URL takes precedence over the individual fields below (which stay
  // as the local-dev default).
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  QR_HMAC_SECRET: z.string().min(16),

  ADMIN_ORIGIN: z.string().url().default('http://localhost:5173'),
  TRACKING_ORIGIN: z.string().url().default('http://localhost:3001'),
  SCAN_ORIGIN: z.string().url().default('http://localhost:5174'),
  // Comma-separated production origins, for example the three Vercel app URLs.
  ALLOWED_ORIGINS: z.string().default(''),
  PUBLIC_TRACKING_URL: z.string().url().default('http://localhost:3001'),

  EXCHANGE_RATE_USD_XOF: z.coerce.number().positive().default(563),

  AQILAS_API_URL: z.string().url().default('https://www.aqilas.com/api/v1'),
  AQILAS_API_TOKEN: z.string().optional(),
  AQILAS_SENDER_ID: z.string().max(11).optional(),
})

export type AppEnv = z.infer<typeof EnvSchema>

@Injectable()
export class AppConfigService {
  private readonly env: AppEnv

  constructor(private readonly config: ConfigService) {
    const parsed = EnvSchema.safeParse(process.env)
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
      throw new Error('Invalid environment configuration')
    }
    this.env = parsed.data
  }

  get isProd(): boolean { return this.env.NODE_ENV === 'production' }
  get isDev(): boolean { return this.env.NODE_ENV === 'development' }
  get port(): number { return this.env.PORT }

  get databaseUrl(): string { return this.env.DATABASE_URL }

  get redis() {
    return {
      url: this.env.REDIS_URL,
      host: this.env.REDIS_HOST,
      port: this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
    }
  }

  get jwt() {
    return {
      accessSecret: this.env.JWT_ACCESS_SECRET,
      refreshSecret: this.env.JWT_REFRESH_SECRET,
      accessTtl: this.env.JWT_ACCESS_TTL,
      refreshTtl: this.env.JWT_REFRESH_TTL,
    }
  }

  get qrSecret(): string { return this.env.QR_HMAC_SECRET }

  get adminOrigin(): string { return this.env.ADMIN_ORIGIN }
  get trackingOrigin(): string { return this.env.TRACKING_ORIGIN }
  get scanOrigin(): string { return this.env.SCAN_ORIGIN }
  get corsOrigins(): string[] {
    return [...new Set([
      this.env.ADMIN_ORIGIN,
      this.env.TRACKING_ORIGIN,
      this.env.SCAN_ORIGIN,
      ...this.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    ])]
  }
  isCorsOriginAllowed(origin?: string): boolean {
    return !origin || this.corsOrigins.includes(origin)
  }
  get publicTrackingUrl(): string { return this.env.PUBLIC_TRACKING_URL }

  get defaultExchangeRateUsdToXof(): number { return this.env.EXCHANGE_RATE_USD_XOF }

  get aqilas() {
    return {
      apiUrl: this.env.AQILAS_API_URL,
      apiToken: this.env.AQILAS_API_TOKEN,
      senderId: this.env.AQILAS_SENDER_ID,
      /** False until a token + validated sender ID are configured. */
      isConfigured: Boolean(this.env.AQILAS_API_TOKEN && this.env.AQILAS_SENDER_ID),
    }
  }
}
