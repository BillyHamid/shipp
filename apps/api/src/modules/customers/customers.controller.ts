import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CreateCustomerDtoSchema, type CreateCustomerDto } from '@gsg/shared-types/schemas'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { CustomersService } from './customers.service.js'

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  list(
    @Query('query') query?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.customers.list({
      query,
      country,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  get(@Param('id') id: string) {
    return this.customers.findById(id)
  }

  @Get(':id/history')
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  history(@Param('id') id: string) {
    return this.customers.historyByCustomer(id)
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CUSTOMERS_MANAGE)
  create(@Body(new ZodValidationPipe(CreateCustomerDtoSchema)) dto: CreateCustomerDto) {
    return this.customers.create(dto)
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMERS_MANAGE)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateCustomerDtoSchema.partial())) dto: Partial<CreateCustomerDto>,
  ) {
    return this.customers.update(id, dto)
  }
}
