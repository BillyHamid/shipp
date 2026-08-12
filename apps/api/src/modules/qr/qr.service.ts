import { Injectable } from '@nestjs/common'
import * as crypto from 'node:crypto'
import * as QRCode from 'qrcode'
import { AppConfigService } from '../../common/config/app-config.service.js'

/**
 * Signs and verifies QR payloads for parcels, and renders the QR image.
 *
 * The signature (HMAC-SHA256) proves the tracking number in a scanned QR
 * hasn't been tampered with — without it, anyone could craft a QR pointing
 * at an arbitrary tracking number and trick an agent's scan flow.
 */
@Injectable()
export class QrService {
  constructor(private readonly config: AppConfigService) {}

  /** Deterministic signature stored on Parcel.qrSignature. */
  sign(trackingNumber: string): string {
    return crypto
      .createHmac('sha256', this.config.qrSecret)
      .update(trackingNumber)
      .digest('hex')
  }

  verify(trackingNumber: string, signature: string): boolean {
    const expected = this.sign(trackingNumber)
    // Constant-time comparison to avoid timing attacks
    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }

  /** Public URL encoded into the QR (also usable as the tracking page link). */
  buildTrackingUrl(trackingNumber: string, signature: string): string {
    const url = new URL(`/p/${trackingNumber}`, this.config.publicTrackingUrl)
    url.searchParams.set('s', signature)
    return url.toString()
  }

  /** Render an SVG QR code for a parcel, ready to embed in a ticket or admin UI. */
  async renderSvg(trackingNumber: string, signature: string): Promise<string> {
    const content = this.buildTrackingUrl(trackingNumber, signature)
    return QRCode.toString(content, { type: 'svg', errorCorrectionLevel: 'H', margin: 1 })
  }

  /** Parse a scanned QR's URL back into { trackingNumber, signature }, or null if malformed. */
  parseScannedUrl(raw: string): { trackingNumber: string; signature: string } | null {
    try {
      const url = new URL(raw)
      const match = /\/p\/([A-Z0-9-]+)$/.exec(url.pathname)
      const signature = url.searchParams.get('s')
      if (!match || !signature) return null
      return { trackingNumber: match[1]!, signature }
    } catch {
      return null
    }
  }
}
