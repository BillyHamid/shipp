import { Controller, Get, Query } from '@nestjs/common'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { DashboardService } from './dashboard.service.js'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('kpis')
  @RequirePermissions(PERMISSIONS.DASHBOARD_VIEW)
  kpis() {
    return this.dashboard.kpis()
  }

  @Get('chart')
  @RequirePermissions(PERMISSIONS.DASHBOARD_VIEW)
  chart(@Query('year') year?: string) {
    return this.dashboard.chart(year ? Number(year) : new Date().getFullYear())
  }
}
