import { Injectable, NotFoundException } from '@nestjs/common'
import { PARCEL_STATE_LABELS, type ParcelState } from '@gsg/shared-types/domain'
import { PrismaService } from '../../common/prisma/prisma.service.js'

export interface PublicTimelineStep {
  state: ParcelState
  label: string
  occurredAt: string | null
  done: boolean
}

export interface PublicTrackingResult {
  trackingNumber: string
  originCountry: string
  destCountry: string
  category: string
  currentState: ParcelState
  currentStateLabel: string
  estimatedDelivery: string | null
  recipientMasked: string
  timeline: PublicTimelineStep[]
}

/**
 * The ONLY forward-facing surface of the whole system. Every field here is
 * an explicit allow-list — nothing from the Parcel model reaches the
 * response unless it's named below. Never widen this by spreading `parcel`.
 */
@Injectable()
export class PublicTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async track(trackingNumber: string): Promise<PublicTrackingResult> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingNumber },
      include: {
        recipient: { select: { fullName: true } },
        events: {
          where: { eventType: 'state_transition' },
          orderBy: { occurredAt: 'asc' },
          select: { toState: true, occurredAt: true },
        },
      },
    })

    // Same 404 whether the tracking number doesn't exist or is malformed —
    // never leak which case it is (avoids enumeration probing).
    if (!parcel) throw new NotFoundException('Tracking number not found')

    const reachedStates = new Map<ParcelState, string>()
    for (const evt of parcel.events) {
      if (evt.toState) reachedStates.set(evt.toState, evt.occurredAt.toISOString())
    }

    const displayOrder: ParcelState[] =
      parcel.currentState === 'cancelled'
        ? ['registered', 'cancelled']
        : [
            'registered',
            'received_warehouse',
            'preparing',
            'shipped',
            'in_transit',
            'arrived_country',
            'customs',
            'out_for_delivery',
            'delivered',
          ]

    const timeline: PublicTimelineStep[] = displayOrder.map((state) => ({
      state,
      label: PARCEL_STATE_LABELS[state],
      occurredAt: reachedStates.get(state) ?? null,
      done: reachedStates.has(state),
    }))

    return {
      trackingNumber: parcel.trackingNumber,
      originCountry: parcel.originCountry,
      destCountry: parcel.destCountry,
      category: parcel.category,
      currentState: parcel.currentState,
      currentStateLabel: PARCEL_STATE_LABELS[parcel.currentState],
      estimatedDelivery: parcel.estimatedDelivery?.toISOString() ?? null,
      recipientMasked: this.maskName(parcel.recipient.fullName),
      timeline,
    }
  }

  private maskName(fullName: string): string {
    const trimmed = fullName.trim()
    if (trimmed.length <= 2) return trimmed[0] + '*'
    return `${trimmed[0]}${'*'.repeat(Math.min(trimmed.length - 2, 4))}${trimmed[trimmed.length - 1]}`
  }
}
