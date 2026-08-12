import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common'
import { z } from 'zod'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'
import { NotificationLinksService } from './notification-links.service.js'
import { AqilasSmsService } from './aqilas-sms.service.js'

const NotifyLogDtoSchema = z.object({ channel: z.enum(['whatsapp', 'sms']) })
type NotifyLogDto = z.infer<typeof NotifyLogDtoSchema>

@Controller('parcels/:id')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly links: NotificationLinksService,
    private readonly sms: AqilasSmsService,
  ) {}

  /**
   * Returns a ready-to-open WhatsApp link + composed message for this
   * parcel's current state. Used by the WhatsApp button only — SMS is now
   * sent directly via `POST .../notify-sms` instead of building a `sms:` link.
   */
  @Get('notify-links')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  async getLinks(@Param('id') id: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: { recipient: true },
    })
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`)

    return this.links.build(parcel, parcel.recipient)
  }

  /**
   * Sends a real SMS via the Aqilas gateway using the same message template
   * as the WhatsApp link. Unlike `notify-log` (which only records that an
   * agent *opened* a link), this records an actual delivery attempt with
   * the gateway's own confirmation (bulk_id, cost).
   */
  @Post('notify-sms')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  async sendSms(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: { recipient: true },
    })
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`)

    const { phone, message } = this.links.build(parcel, parcel.recipient)
    const result = await this.sms.send(phone, message)

    await this.prisma.parcelEvent.create({
      data: {
        parcelId: id,
        eventType: 'note',
        action: 'notify_customer',
        actorId: user.id,
        metadata: {
          channel: 'sms',
          bulkId: result.bulkId,
          cost: result.cost,
          currency: result.currency,
        },
      },
    })

    return result
  }

  /**
   * Best-effort audit trail for the WhatsApp link (which we can't confirm
   * was actually sent, since it just opens an external app): records that
   * an agent opened it. SMS uses `notify-sms` instead, which logs a real
   * gateway confirmation rather than just "the link was opened".
   */
  @Post('notify-log')
  @RequirePermissions(PERMISSIONS.PARCELS_READ)
  async logNotification(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(NotifyLogDtoSchema)) dto: NotifyLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } })
    if (!parcel) throw new NotFoundException(`Parcel ${id} not found`)

    await this.prisma.parcelEvent.create({
      data: {
        parcelId: id,
        eventType: 'note',
        action: 'notify_customer',
        actorId: user.id,
        metadata: { channel: dto.channel },
      },
    })

    return { logged: true }
  }
}
