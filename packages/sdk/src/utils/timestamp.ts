/**
 * Returns the current time as an ISO 8601 timestamp string.
 *
 * @example
 * now() // "2024-11-15T08:30:00.123Z"
 */
export function now(): string {
  return new Date().toISOString();
}
