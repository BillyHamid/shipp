import type { Parcel, ParcelEvent } from '@prisma/client'

/**
 * Domain event published every time a parcel changes state.
 * Subscribers (WS broadcast, notifications, dashboard cache invalidation)
 * react to this without the command handler knowing they exist.
 */
export class ParcelTransitionedDomainEvent {
  constructor(
    public readonly parcel: Parcel,
    public readonly event: ParcelEvent,
    public readonly actorName: string,
  ) {}
}

export class ParcelCreatedDomainEvent {
  constructor(public readonly parcel: Parcel) {}
}
