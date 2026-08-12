import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common'
import {
  PARCEL_TRANSITIONS,
  isTerminalState,
  type ParcelAction,
  type ParcelState,
  type ParcelTransition,
} from '@gsg/shared-types/domain'
import { hasPermission } from '@gsg/shared-types/permissions'
import type { TransitionMetadata } from '@gsg/shared-types/schemas'

export interface TransitionRequest {
  from: ParcelState
  action: ParcelAction
  userPermissions: readonly string[]
}

/**
 * THE state machine. This is the single authority on whether a parcel
 * transition is legal. Nothing in this codebase should mutate
 * `parcel.currentState` without going through `assertTransition`.
 */
@Injectable()
export class ParcelStateMachine {
  /**
   * Validate that `action` can move a parcel out of `from`, and that the
   * caller's permissions cover it. Throws on any violation. Returns the
   * matched transition (which the caller uses to know the target state
   * and required metadata) on success.
   */
  assertTransition(req: TransitionRequest): ParcelTransition {
    if (isTerminalState(req.from)) {
      throw new UnprocessableEntityException(
        `Parcel is in terminal state '${req.from}' — no further transitions allowed`,
      )
    }

    const transition = PARCEL_TRANSITIONS.find(
      (t) => t.action === req.action && (t.from === req.from || t.from === '*'),
    )

    if (!transition) {
      throw new UnprocessableEntityException(
        `Action '${req.action}' is not valid from state '${req.from}'`,
      )
    }

    const requiredPermission = this.permissionForAction(req.action)
    if (!hasPermission(req.userPermissions, requiredPermission)) {
      throw new ForbiddenException(`Missing permission '${requiredPermission}' for this action`)
    }

    return transition
  }

  /** Validate that all metadata required by a transition is present. */
  assertRequirements(transition: ParcelTransition, metadata: TransitionMetadata): void {
    if (!transition.requires) return

    for (const req of transition.requires) {
      switch (req) {
        case 'photo':
          if (!metadata.photo) throw new UnprocessableEntityException('Photo proof is required')
          break
        case 'recipient_signature':
          if (!metadata.recipientSignature) {
            throw new UnprocessableEntityException('Recipient signature is required')
          }
          break
        case 'reason':
          if (!metadata.reason || metadata.reason.trim().length < 3) {
            throw new UnprocessableEntityException('A reason (min 3 chars) is required')
          }
          break
        case 'box_id':
          if (!metadata.boxId) throw new UnprocessableEntityException('A target box is required')
          break
        case 'geo':
          // Optional in practice (browser may deny geolocation); we don't hard-fail.
          break
      }
    }
  }

  /** Given a state + permission set, list actions the caller is allowed to trigger. */
  allowedActions(from: ParcelState, userPermissions: readonly string[]): ParcelAction[] {
    if (isTerminalState(from)) return []

    return PARCEL_TRANSITIONS.filter((t) => t.from === from || t.from === '*')
      .filter((t) => hasPermission(userPermissions, this.permissionForAction(t.action)))
      .map((t) => t.action)
  }

  private permissionForAction(action: ParcelAction): string {
    return `parcels.transition.${action}`
  }
}
