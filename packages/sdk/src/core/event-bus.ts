/**
 * Represents a single event flowing through the OpenDataLayer.
 */
export interface ODLEvent {
  /** Dot-namespaced event name, e.g. "ecommerce.purchase" */
  event: string;
  /** Unique identifier (UUID v4) */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** ODL specification version */
  specVersion: string;
  /** Ambient context snapshot at the time the event was created */
  context?: Record<string, unknown>;
  /** Event-specific payload */
  data?: Record<string, unknown>;
  /** Flat key/value custom dimensions for analytics tools */
  customDimensions?: Record<string, string | number | boolean>;
  /** Information about the source that created the event */
  source?: { name: string; version: string };
}

type EventHandler = (event: ODLEvent) => void;

/**
 * A typed event bus supporting wildcard pattern subscriptions.
 *
 * Patterns:
 * - `"*"` matches every event.
 * - `"category.*"` matches any event whose name starts with `"category."`.
 * - An exact string matches only that event name.
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to events matching `pattern`.
   *
   * @returns An unsubscribe function.
   */
  on(pattern: string, handler: EventHandler): () => void {
    let set = this.handlers.get(pattern);
    if (!set) {
      set = new Set();
      this.handlers.set(pattern, set);
    }
    set.add(handler);

    return () => {
      this.off(pattern, handler);
    };
  }

  /**
   * Remove a previously registered handler for `pattern`.
   */
  off(pattern: string, handler: EventHandler): void {
    const set = this.handlers.get(pattern);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(pattern);
      }
    }
  }

  /**
   * Emit an event. All handlers whose pattern matches the event name will be
   * called synchronously in registration order.
   */
  emit(event: ODLEvent): void {
    for (const [pattern, handlers] of this.handlers) {
      if (this.matchPattern(pattern, event.event)) {
        for (const handler of handlers) {
          try {
            handler(event);
          } catch {
            // Swallow handler errors so one broken subscriber cannot
            // prevent others from receiving the event.
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Determine whether `eventName` matches the given subscription `pattern`.
   *
   * - `"*"` matches everything.
   * - `"foo.*"` matches any event name starting with `"foo."`.
   * - Otherwise an exact equality check is used.
   */
  private matchPattern(pattern: string, eventName: string): boolean {
    if (pattern === '*') {
      return true;
    }

    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -1); // e.g. "ecommerce."
      return eventName.startsWith(prefix);
    }

    return pattern === eventName;
  }
}
