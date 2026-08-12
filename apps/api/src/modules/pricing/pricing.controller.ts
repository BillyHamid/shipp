import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { z } from 'zod'
import { QuotePriceDtoSchema, type QuotePriceDto } from '@gsg/shared-types/schemas'
import { PARCEL_CATEGORIES } from '@gsg/shared-types/domain'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { PricingService } from './pricing.service.js'

const CreatePricingRuleDtoSchema = z.object({
  label: z.string().min(2).max(120),
  category: z.enum(PARCEL_CATEGORIES),
  originCountry: z.string().min(2).max(60),
  destCountry: z.string().min(2).max(60),
  basePriceUsd: z.number().nonnegative(),
  perKgUsd: z.number().nonnegative(),
})
type CreatePricingRuleDto = z.infer<typeof CreatePricingRuleDtoSchema>

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRICING_READ)
  list() {
    return this.pricing.list()
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRICING_READ)
  get(@Param('id') id: string) {
    return this.pricing.findById(id)
  }

  @Post('quote')
  @RequirePermissions(PERMISSIONS.PRICING_READ)
  quote(@Body(new ZodValidationPipe(QuotePriceDtoSchema)) dto: QuotePriceDto) {
    return this.pricing.quote(dto)
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRICING_MANAGE)
  create(@Body(new ZodValidationPipe(CreatePricingRuleDtoSchema)) dto: CreatePricingRuleDto) {
    return this.pricing.create(dto)
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.PRICING_MANAGE)
  deactivate(@Param('id') id: string) {
    return this.pricing.deactivate(id)
  }
}
