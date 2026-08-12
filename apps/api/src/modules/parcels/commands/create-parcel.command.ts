import type { CreateParcelDto } from '@gsg/shared-types/schemas'

export class CreateParcelCommand {
  constructor(
    public readonly dto: CreateParcelDto,
    public readonly createdById: string,
  ) {}
}
