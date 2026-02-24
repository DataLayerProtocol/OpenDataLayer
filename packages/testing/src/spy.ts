/**
 * ODL Spy - captures events in tests for assertions.
 */

export interface CapturedEvent {
  event: string;
  id: string;
  timestamp: string;
  specVersion: string;
  context?: Record<string, unknown>;
  data?: Record<string, unknown>;
  customDimensions?: Record<string, string | number | boolean>;
}

/**
 * Convert a wildcard pattern (e.g. "ecommerce.*") into a RegExp.
 * Supports:
 *   - "*"  matches a single segment (one or more non-dot characters)
 *   - "**" matches one or more segments (including dots)
 */
function patternToRegex(pattern: string): RegExp {
  // Escape regex special chars except * and .
  let regex = '';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i] as string;

    if (char === '*') {
      if (pattern[i + 1] === '*') {
        // "**" matches one or more segments
        regex += '.+';
        i += 2;
      } else {
        // "*" matches a single segment (no dots)
        regex += '[^.]+';
        i += 1;
      }
    } else if (char === '.') {
      regex += '\\.';
      i += 1;
    } else {
      // Escape any regex-special character
      regex += char.replace(/[{}()[\]\\^$|?+]/g, '\\$&');
      i += 1;
    }
  }

  return new RegExp(`^${regex}$`);
}

export class ODLSpy {
  private events: CapturedEvent[] = [];
  private _unsubscribe?: () => void;

  /** Get all captured events */
  getEvents(): readonly CapturedEvent[] {
    return this.events;
  }

  /** Get events matching a pattern (supports wildcards like ecommerce.*) */
  getByPattern(pattern: string): CapturedEvent[] {
    const regex = patternToRegex(pattern);
    return this.events.filter((e) => regex.test(e.event));
  }

  /** Get the last captured event */
  getLastEvent(): CapturedEvent | undefined {
    return this.events[this.events.length - 1];
  }

  /** Get events by exact event name */
  getByName(eventName: string): CapturedEvent[] {
    return this.events.filter((e) => e.event === eventName);
  }

  /** Get count of captured events */
  get count(): number {
    return this.events.length;
  }

  /** Check if an event with given name was captured */
  hasEvent(eventName: string): boolean {
    return this.events.some((e) => e.event === eventName);
  }

  /** Record an event (called by the test harness) */
  record(event: CapturedEvent): void {
    this.events.push(event);
  }

  /** Clear all captured events */
  clear(): void {
    this.events = [];
  }

  /** Create a handler function suitable for odl.on('*', handler) */
  handler(): (event: CapturedEvent) => void {
    return (event: CapturedEvent) => {
      this.record(event);
    };
  }

  /** Set unsubscribe callback for cleanup */
  setUnsubscribe(fn: () => void): void {
    this._unsubscribe = fn;
  }

  /** Unsubscribe from event bus if connected */
  disconnect(): void {
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }
}
