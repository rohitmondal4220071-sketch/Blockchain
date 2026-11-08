// User identity resolution and truncation (Requirements 6.4, 6.5, 6.7).

export type Session =
  | { kind: "guest" }
  | { kind: "authenticated"; identifier: string | null };

export const GUEST_LABEL = "Guest User";
export const MAX_IDENTIFIER_LENGTH = 32;
const ELLIPSIS = "…";

/**
 * Returns `id` unchanged when its length is at most `max`. When longer, returns
 * a string of length at most `max` (including a trailing ellipsis) whose
 * non-ellipsis portion is a prefix of `id`.
 */
export function truncateIdentifier(
  id: string,
  max: number = MAX_IDENTIFIER_LENGTH
): string {
  const chars = Array.from(id);
  if (chars.length <= max) return id;
  const keep = Math.max(0, max - ELLIPSIS.length);
  return chars.slice(0, keep).join("") + ELLIPSIS;
}

/**
 * Resolves the label shown in the identity area. Guests and authenticated
 * sessions without an identifier both resolve to "Guest User". Never empty.
 */
export function resolveUserIdentity(session: Session): string {
  if (session.kind === "guest") return GUEST_LABEL;
  const id = session.identifier;
  if (id === null || id.trim() === "") return GUEST_LABEL;
  return truncateIdentifier(id);
}
