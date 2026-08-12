import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import type { BoxType } from '@gsg/shared-types/domain'

/**
 * Generates human-readable, sequential-per-year box references:
 *   BOX-EXPRESS-2026-000123
 *   BOX-CARGO-2026-000045
 *
 * Sequential numbering (unlike parcel tracking numbers) is fine here:
 * box references are internal-only, never exposed to the public.
 */
@Injectable()
export class BoxReferenceFactory {
  constructor(private readonly prisma: PrismaService) {}

  async generate(type: BoxType): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `BOX-${type}-${year}-`

    const count = await this.prisma.box.count({
      where: { reference: { startsWith: prefix } },
    })

    const seq = String(count + 1).padStart(6, '0')
    return `${prefix}${seq}`
  }
}
