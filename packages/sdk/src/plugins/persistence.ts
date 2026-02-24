import type { DataLayer } from '../core/data-layer.js';
import type { ODLEvent } from '../core/event-bus.js';
import type { ODLPlugin } from './types.js';

export interface PersistenceOptions {
  /** localStorage key used to store events (default: `"odl_events"`). */
  key?: string;
  /** Maximum number of events to keep in storage (default: 100). */
  maxEvents?: number;
}

/**
 * Check whether `localStorage` is available and functional.
 * Handles cases where the API exists but throws (e.g. Safari private mode,
 * SSR environments, restrictive CSP).
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const testKey = '__odl_ls_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Plugin that persists events to `localStorage`.
 *
 * - On initialisation, previously stored events are restored into the data layer
 *   (via direct push — they will pass through middleware again if any is configured).
 * - After each new event, the full event array is serialised to localStorage,
 *   capped at `maxEvents` (oldest events are discarded first).
 * - Gracefully degrades to a no-op in non-browser / restricted environments.
 */
export function persistence(options?: PersistenceOptions): ODLPlugin {
  const storageKey = options?.key ?? 'odl_events';
  const maxEvents = options?.maxEvents ?? 100;

  let available = false;

  return {
    name: 'persistence',

    initialize(_odl: DataLayer): void {
      available = isLocalStorageAvailable();
      if (!available) {
        return;
      }

      // Restore previously persisted events (if any).
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const stored = JSON.parse(raw) as ODLEvent[];
          if (Array.isArray(stored)) {
            // Re-push each event so it flows through normal processing
            for (const event of stored) {
              if (event.event) {
                _odl.push(event.event, event.data, event.customDimensions);
              }
            }
          }
        }
      } catch {
        // Corrupted data — silently ignore.
      }
    },

    afterEvent(event: ODLEvent): void {
      if (!available) {
        return;
      }

      try {
        const raw = localStorage.getItem(storageKey);
        let events: ODLEvent[] = [];
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            events = parsed as ODLEvent[];
          }
        }

        events.push(event);

        // Cap the array length
        if (events.length > maxEvents) {
          events = events.slice(events.length - maxEvents);
        }

        localStorage.setItem(storageKey, JSON.stringify(events));
      } catch {
        // Storage full or otherwise inaccessible — silently ignore.
      }
    },

    destroy(): void {
      // Nothing to clean up — we intentionally leave persisted data in place.
    },
  };
}
