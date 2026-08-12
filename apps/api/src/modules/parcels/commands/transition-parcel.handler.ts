import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs'
import { NotFoundException } from '@nestjs/common'
import { Parcel } from '@prisma/client'
import { PrismaService } from '../../../common/prisma/prisma.service.js'
import { ParcelStateMachine } from '../domain/parcel-state-machine.js'
import { estimateDeliveryDate } from '../domain/estimated-delivery.js'
import { ParcelTransitionedDomainEvent } from '../events/parcel-transitioned.event.js'
import { TransitionParcelCommand } from './transition-parcel.command.js'

@CommandHandler(TransitionParcelCommand)
export class TransitionParcelHandler implements ICommandHandler<TransitionParcelCommand, Parcel> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: ParcelStateMachine,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: TransitionParcelCommand): Promise<Parcel> {
    const { parcelId, action, metadata, actor } = cmd

    const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } })
    if (!parcel) throw new NotFoundException(`Parcel ${parcelId} not found`)

    // 1. Validate transition is legal for this state + role
    const transition = this.stateMachine.assertTransition({
      from: parcel.currentState,
      action,
      userPermissions: actor.permissions,
    })

    // 2. Validate required proof/metadata is present
    this.stateMachine.assertRequirements(transition, metadata)

    // 3. Special case: assign_to_box also sets parcel.boxId
    const extraData: Record<string, unknown> = {}
    if (action === 'assign_to_box' && metadata.boxId) {
      const box = await this.prisma.box.findUnique({ where: { id: metadata.boxId } })
      if (!box) throw new NotFoundException(`Box ${metadata.boxId} not found`)
      extraData.boxId = metadata.boxId
    }

    // 4. Transaction: append event (immutable) + update projection
    const { updated, event } = await this.prisma.$transaction(async (tx) => {
      const evt = await tx.parcelEvent.create({
        data: {
          parcelId: parcel.id,
          eventType: 'state_transition',
          action,
          fromState: parcel.currentState,
          toState: transition.to,
          actorId: actor.id,
          scanned: metadata.scanned ?? false,
          geoLocation: metadata.geo ?? undefined,
          metadata: {
            reason: metadata.reason,
            // MVP: stored inline as base64 in JSONB. Swap for an object-storage
            // upload (S3-compatible) + key reference once photo volume grows.
            photo: metadata.photo,
            recipientSignature: metadata.recipientSignature,
          },
        },
      })

      const p = await tx.parcel.update({
        where: { id: parcel.id },
        data: {
          currentState: transition.to,
          estimatedDelivery: estimateDeliveryDate(transition.to),
          ...extraData,
        },
      })

      return { updated: p, event: evt }
    })

    // 5. Publish domain event for side-effects (WS broadcast, notifications, cache)
    this.eventBus.publish(new ParcelTransitionedDomainEvent(updated, event, actor.fullName))

    return updated
  }
}
