import { Body, Controller, Get, Header, Param, Post, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import {
  CreateParcelDtoSchema,
  TransitionParcelDtoSchema,
  type CreateParcelDto,
  type TransitionParcelDto,
} from '@gsg/shared-types/schemas'
import { PARCEL_STATES, PAYMENT_STATES, type ParcelState, type PaymentState } from '@gsg/shared-types/domain'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { CreateParcelCommand, TransitionParcelCommand } from './commands/index.js'
import { ListParcelsQuery, GetParcelQuery, GetParcelEventsQuery } from './queries/index.js'
import { ParcelStateMachine } from './domain/parcel-state-machine.js'
import { QrService } from '../qr/qr.service.js'

@Controller('parcels')
export class ParcelsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly stateMachine: ParcelStateMachine,
    private readonly qr: QrService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  list(
    @Query('query') query?: string,
    @Query('state') state?: string,
    @Query('paymentState') paymentState?: string,
    @Query('boxId') boxId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.queryBus.execute(
      new ListParcelsQuery({
        query,
        state: this.isValidState(state) ? state : undefined,
        paymentState: this.isValidPaymentState(paymentState) ? paymentState : undefined,
        boxId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      }),
    )
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  get(@Param('id') id: string) {
    return this.queryBus.execute(new GetParcelQuery(id))
  }

  @Get(':id/events')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  events(@Param('id') id: string) {
    return this.queryBus.execute(new GetParcelEventsQuery(id))
  }

  /** What actions can the current user trigger on this parcel right now? */
  @Get(':id/allowed-actions')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  async allowedActions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const parcel = await this.queryBus.execute(new GetParcelQuery(id))
    return { actions: this.stateMachine.allowedActions(parcel.currentState, user.permissions) }
  }

  @Get(':id/qr')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  @Header('Content-Type', 'image/svg+xml')
  async qrCode(@Param('id') id: string): Promise<string> {
    const parcel = await this.queryBus.execute(new GetParcelQuery(id))
    return this.qr.renderSvg(parcel.trackingNumber, parcel.qrSignature)
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PARCELS_CREATE)
  create(
    @Body(new ZodValidationPipe(CreateParcelDtoSchema)) dto: CreateParcelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commandBus.execute(new CreateParcelCommand(dto, user.id))
  }

  @Post(':id/transitions')
  transition(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransitionParcelDtoSchema)) dto: TransitionParcelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // No @RequirePermissions here: the state machine itself checks
    // `parcels.transition.{action}` dynamically based on the action in
    // the body, which a static decorator can't express.
    return this.commandBus.execute(
      new TransitionParcelCommand(id, dto.action, dto.metadata, user),
    )
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.PARCELS_CANCEL)
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commandBus.execute(
      new TransitionParcelCommand(id, 'cancel', { reason }, user),
    )
  }

  private isValidState(v?: string): v is ParcelState {
    return !!v && (PARCEL_STATES as readonly string[]).includes(v)
  }

  private isValidPaymentState(v?: string): v is PaymentState {
    return !!v && (PAYMENT_STATES as readonly string[]).includes(v)
  }
}
