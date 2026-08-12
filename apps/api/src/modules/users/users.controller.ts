import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateUserDtoSchema, type CreateUserDto } from '@gsg/shared-types/schemas'
import { PERMISSIONS } from '@gsg/shared-types/permissions'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js'
import { UsersService } from './users.service.js'

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  list() {
    return this.users.list()
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  create(@Body(new ZodValidationPipe(CreateUserDtoSchema)) dto: CreateUserDto) {
    return this.users.create(dto)
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  deactivate(@Param('id') id: string) {
    return this.users.setActive(id, false)
  }

  @Post(':id/activate')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  activate(@Param('id') id: string) {
    return this.users.setActive(id, true)
  }
}
