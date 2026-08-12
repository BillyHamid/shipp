import { Injectable } from '@nestjs/common'
import type { Customer, Parcel } from '@prisma/client'
import { AppConfigService } from '../../common/config/app-config.service.js'
import { callingCodeForCountry } from './country-calling-codes.js'
import { renderNotificationMessage } from './notification-templates.js'

export interface NotificationLinks {
  /** Normalized phone, digits only, with country calling code — no leading '+'. */
  phone: string
  message: string
  whatsappUrl: string
}

@Injectable()
export class NotificationLinksService {
  constructor(private readonly config: AppConfigService) {}

  build(parcel: Parcel, recipient: Pick<Customer, 'fullName' | 'phone' | 'country'>): NotificationLinks {
    const trackingUrl = new URL(`/p/${parcel.trackingNumber}`, this.config.publicTrackingUrl).toString()
    const message = renderNotificationMessage(
      parcel.currentState,
      recipient.fullName,
      parcel.trackingNumber,
      trackingUrl,
    )
    const phone = this.normalizePhone(recipient.phone, recipient.country)

    return {
      phone,
      message,
      whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    }
  }

  /**
   * Best-effort E.164-ish normalization: strip everything but digits, then
   * prepend the recipient's country calling code unless the number already
   * appears to carry one. Legacy data is inconsistent (some numbers include
   * a country code, most don't) — this can't be perfect without asking the
   * customer, but it covers the common case for our operating corridors.
   */
  private normalizePhone(rawPhone: string, country: string): string {
    const digits = rawPhone.replace(/\D/g, '')
    const callingCode = callingCodeForCountry(country)
    if (!callingCode) return digits
    if (digits.startsWith(callingCode)) return digits
    return `${callingCode}${digits}`
  }
}
