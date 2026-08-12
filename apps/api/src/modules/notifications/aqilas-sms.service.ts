import { Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common'
import { AppConfigService } from '../../common/config/app-config.service.js'

export interface SendSmsResult {
  success: boolean
  bulkId: string
  cost: number
  currency: string
}

interface AqilasBulkSmsResponse {
  success: boolean
  message: string
  bulk_id: string
  cost: number
  currency: string
}

/**
 * Thin client for Aqilas's SMS gateway (https://www.aqilas.com).
 * Docs: POST {apiUrl}/bulksms — see notifications module README for the
 * full request/response shape.
 */
@Injectable()
export class AqilasSmsService {
  private readonly logger = new Logger(AqilasSmsService.name)

  constructor(private readonly config: AppConfigService) {}

  async send(toPhoneDigits: string, text: string): Promise<SendSmsResult> {
    const { apiUrl, apiToken, senderId, isConfigured } = this.config.aqilas
    if (!isConfigured) {
      throw new ServiceUnavailableException(
        'SMS gateway not configured (missing AQILAS_API_TOKEN or AQILAS_SENDER_ID)',
      )
    }

    // Aqilas expects E.164 with a leading '+'; our stored phone is digits-only.
    const to = toPhoneDigits.startsWith('+') ? toPhoneDigits : `+${toPhoneDigits}`

    let response: Response
    try {
      response = await fetch(`${apiUrl}/bulksms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': apiToken!,
        },
        body: JSON.stringify({
          from: senderId,
          messages: [{ to, text }],
        }),
      })
    } catch (err) {
      this.logger.error(`Aqilas request failed: ${(err as Error).message}`)
      throw new ServiceUnavailableException('Could not reach the SMS gateway')
    }

    const body = (await response.json().catch(() => null)) as AqilasBulkSmsResponse | null

    if (!response.ok || !body?.success) {
      // Known Aqilas error cases: 400 invalid data/contact or insufficient
      // credit, 404 sender ID invalid/not yet validated.
      this.logger.warn(
        `Aqilas SMS send failed (HTTP ${response.status}): ${body?.message ?? 'unknown error'}`,
      )
      throw new InternalServerErrorException(body?.message ?? 'SMS gateway rejected the request')
    }

    return {
      success: body.success,
      bulkId: body.bulk_id,
      cost: body.cost,
      currency: body.currency,
    }
  }
}
