import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'

/**
 * Validate and transform incoming DTOs using a Zod schema.
 *
 * @example
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateParcelDtoSchema)) dto: CreateParcelDto) { ... }
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _meta: ArgumentMetadata): T {
    try {
      return this.schema.parse(value)
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: err.flatten().fieldErrors,
        })
      }
      throw err
    }
  }
}
