import type { ODLEvent } from '../core/event-bus.js';
import type { ODLPlugin } from './types.js';

export interface DebugOptions {
  /** Custom logger function (defaults to `console.debug`). */
  logger?: (...args: unknown[]) => void;
  /** When true, also logs the full context object. */
  verbose?: boolean;
}

/**
 * Debug plugin that logs every event to the console (or a custom logger).
 *
 * Useful during development for inspecting the event stream in real time.
 */
export function debug(options?: DebugOptions): ODLPlugin {
  const log = options?.logger ?? console.debug.bind(console);
  const verbose = options?.verbose ?? false;

  return {
    name: 'debug',

    afterEvent(event: ODLEvent): void {
      const parts: unknown[] = [
        `[ODL] ${event.event}`,
        { id: event.id, timestamp: event.timestamp },
      ];

      if (event.data && Object.keys(event.data).length > 0) {
        parts.push({ data: event.data });
      }

      if (event.customDimensions && Object.keys(event.customDimensions).length > 0) {
        parts.push({ customDimensions: event.customDimensions });
      }

      if (verbose && event.context && Object.keys(event.context).length > 0) {
        parts.push({ context: event.context });
      }

      log(...parts);
    },
  };
}
