// Protected-action gating decision (Requirements 7.10, 9.1, 9.2, 9.3).

import type { Session } from "./identity";

export type GatingDecision = { type: "open-modal" } | { type: "proceed" };

/**
 * Decides what happens when a protected control is activated. The decision
 * depends only on session state and is identical across all protected controls.
 */
export function decideProtectedAction(session: Session): GatingDecision {
  return session.kind === "authenticated"
    ? { type: "proceed" }
    : { type: "open-modal" };
}
