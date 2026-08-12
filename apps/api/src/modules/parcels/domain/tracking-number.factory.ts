import { Injectable } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { PrismaService } from '../../../common/prisma/prisma.service.js'

/**
 * Alphabet excludes visually-ambiguous characters (I, O, 0, 1) for
 * readability when a customer reads it out loud or types it on a phone.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const RANDOM_LENGTH = 8

/**
 * Generates a non-sequential, non-predictable tracking number:
 *   GSG-US-A4F2K9P1
 *
 * Non-predictability matters: the old system used sequential IDs
 * (TRK-USA5983, TRK-USA5982, ...) which let anyone enumerate every
 * parcel in the system. crypto.randomBytes closes that hole.
 */
@Injectable()
export class TrackingNumberFactory {
  constructor(private readonly prisma: PrismaService) {}

  async generate(originCountry: string): Promise<string> {
    const countryCode = originCountry.slice(0, 2).toUpperCase()

    // Collision probability is astronomically low (33^8 ≈ 1.4e12 combinations),
    // but we still guard against it because correctness > cleverness.
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `GSG-${countryCode}-${this.randomSuffix()}`
      const exists = await this.prisma.parcel.findUnique({
        where: { trackingNumber: candidate },
        select: { id: true },
      })
      if (!exists) return candidate
    }

    throw new Error('Failed to generate unique tracking number after 5 attempts')
  }

  private randomSuffix(): string {
    const bytes = crypto.randomBytes(RANDOM_LENGTH)
    let out = ''
    for (const b of bytes) {
      out += ALPHABET[b % ALPHABET.length]
    }
    return out
  }
}
