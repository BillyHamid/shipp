import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateBoxDtoSchema, type CreateBoxDto } from '@gsg/shared-types/schemas'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { BoxesService } from './boxes.service.js'

@Controller('boxes')
export class BoxesController {
  constructor(private readonly boxes: BoxesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BOXES_READ)
  list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.boxes.list({
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BOXES_READ)
  get(@Param('id') id: string) {
    return this.boxes.findById(id)
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BOXES_MANAGE)
  create(
    @Body(new ZodValidationPipe(CreateBoxDtoSchema)) dto: CreateBoxDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.boxes.create(dto, user.id)
  }

  @Post(':id/dispatch')
  @RequirePermissions(PERMISSIONS.PARCELS_TRANSITION_BOX_DEPARTED)
  dispatch(@Param('id') id: string) {
    return this.boxes.dispatch(id)
  }

  @Post(':id/arrive')
  @RequirePermissions(PERMISSIONS.PARCELS_TRANSITION_BOX_ARRIVED)
  arrive(@Param('id') id: string) {
    return this.boxes.markArrived(id)
  }
}
