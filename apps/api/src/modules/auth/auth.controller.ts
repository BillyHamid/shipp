import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { LoginDtoSchema } from '@gsg/shared-types/schemas'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { AppConfigService } from '../../common/config/app-config.service.js'
import { AuthService, AuthenticatedUser } from './auth.service.js'
import { Public } from './decorators/public.decorator.js'
import { CurrentUser } from './decorators/current-user.decorator.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'

const REFRESH_COOKIE = 'gsg_refresh'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginDtoSchema))
    dto: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthenticatedUser; accessToken: string }> {
    const user = await this.auth.validateCredentials(dto.email, dto.password)
    const { accessToken, refreshToken } = await this.auth.issueTokens(user, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })
    this.setRefreshCookie(res, refreshToken)
    return { user, accessToken }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]
    if (!refreshToken) throw new UnauthorizedException('No refresh token')
    const pair = await this.auth.refresh(refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    })
    this.setRefreshCookie(res, pair.refreshToken)
    return { accessToken: pair.accessToken }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE]
    if (refreshToken) await this.auth.revokeRefreshToken(refreshToken)
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions())
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user
  }

  // ─────────────────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, this.cookieOptions())
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.isProd,
      sameSite: 'strict' as const,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  }
}
