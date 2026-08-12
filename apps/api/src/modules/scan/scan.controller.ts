import { Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { ScanService } from './scan.service.js'

const ScanDtoSchema = z.object({ qrUrl: z.string().url() })
type ScanDto = z.infer<typeof ScanDtoSchema>

@Controller('scan')
export class ScanController {
  constructor(private readonly scan: ScanService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  resolve(
    @Body(new ZodValidationPipe(ScanDtoSchema)) dto: ScanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scan.resolveScannedQr(dto.qrUrl, user);
  }
}
