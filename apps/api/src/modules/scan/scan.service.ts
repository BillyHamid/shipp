import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { QrService } from '../qr/qr.service.js'
import { ParcelStateMachine } from '../parcels/domain/parcel-state-machine.js'
import type { AuthenticatedUser } from '../auth/auth.service.js'

export interface ScanResult {
  parcel: {
    id: string
    trackingNumber: string
    currentState: string
    paymentState: string
    category: string
    weightKg: number
    originCountry: string
    destCountry: string
    sender: { fullName: string }
    recipient: { fullName: string; phone: string }
    box: { reference: string } | null
  }
  allowedActions: string[]
}

@Injectable()
export class ScanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrService,
    private readonly stateMachine: ParcelStateMachine,
  ) {}

  /**
   * Given a raw scanned QR payload (full URL), resolve it to a parcel +
   * the list of actions the scanning agent is allowed to trigger from its
   * current state. This is the entry point for the Scan PWA.
   */
  async resolveScannedQr(rawUrl: string, actor: AuthenticatedUser): Promise<ScanResult> {
    const parsed = this.qr.parseScannedUrl(rawUrl)
    if (!parsed) throw new UnprocessableEntityException('Unrecognized QR code')

    return this.resolveByTrackingNumber(parsed.trackingNumber, parsed.signature, actor)
  }

  async resolveByTrackingNumber(
    trackingNumber: string,
    signature: string,
    actor: AuthenticatedUser,
  ): Promise<ScanResult> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingNumber },
      include: {
        sender: { select: { fullName: true } },
        recipient: { select: { fullName: true, phone: true } },
        box: { select: { reference: true } },
      },
    })
    if (!parcel) throw new NotFoundException('Parcel not found')

    if (!this.qr.verify(trackingNumber, signature)) {
      throw new UnprocessableEntityException('QR signature invalid — possible tampering')
    }

    const allowedActions = this.stateMachine.allowedActions(parcel.currentState, actor.permissions)

    return {
      parcel: {
        id: parcel.id,
        trackingNumber: parcel.trackingNumber,
        currentState: parcel.currentState,
        paymentState: parcel.paymentState,
        category: parcel.category,
        weightKg: Number(parcel.weightKg),
        originCountry: parcel.originCountry,
        destCountry: parcel.destCountry,
        sender: parcel.sender,
        recipient: parcel.recipient,
        box: parcel.box,
      },
      allowedActions,
    }
  }
}
