import type { ParcelAction } from '@gsg/shared-types/domain'
import type { TransitionMetadata } from '@gsg/shared-types/schemas'
import type { AuthenticatedUser } from '../../auth/auth.service.js'

export class TransitionParcelCommand {
  constructor(
    public readonly parcelId: string,
    public readonly action: ParcelAction,
    public readonly metadata: TransitionMetadata,
    public readonly actor: AuthenticatedUser,
  ) {}
}
