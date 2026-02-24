/**
 * Custom Vitest/Jest matchers for ODL event assertions.
 */

import type { CapturedEvent } from '../spy.js';

// biome-ignore lint/suspicious/noExplicitAny: Vitest/Jest matcher signatures require `any` for compatibility
type MatcherFn = (...args: any[]) => any;
declare const expect:
  | {
      extend: (matchers: Record<string, MatcherFn>) => void;
    }
  | undefined;

export interface ODLMatchers<R = unknown> {
  toBeValidODLEvent(): R;
  toBeValidEventName(): R;
  toHaveEventName(name: string): R;
  toHaveContext(key: string): R;
  toHaveData(key: string, value?: unknown): R;
}

/** Valid event name pattern: lowercase dot-namespaced, e.g. "page.view" */
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function toBeValidODLEvent(
  this: { isNot: boolean; utils: { matcherHint: (name: string) => string } },
  received: unknown,
) {
  const event = received as Partial<CapturedEvent>;
  const errors: string[] = [];

  if (!isRecord(received)) {
    return {
      pass: false,
      message: () => 'Expected value to be an object representing an ODL event',
    };
  }

  if (typeof event.event !== 'string' || event.event.length === 0) {
    errors.push('Missing or invalid "event" field (must be a non-empty string)');
  }

  if (typeof event.id !== 'string' || event.id.length === 0) {
    errors.push('Missing or invalid "id" field (must be a non-empty string)');
  }

  if (typeof event.timestamp !== 'string' || event.timestamp.length === 0) {
    errors.push('Missing or invalid "timestamp" field (must be a non-empty string)');
  }

  if (typeof event.specVersion !== 'string' || event.specVersion.length === 0) {
    errors.push('Missing or invalid "specVersion" field (must be a non-empty string)');
  }

  if (event.context !== undefined && !isRecord(event.context)) {
    errors.push('"context" must be an object if present');
  }

  if (event.data !== undefined && !isRecord(event.data)) {
    errors.push('"data" must be an object if present');
  }

  const pass = errors.length === 0;

  return {
    pass,
    message: () =>
      pass
        ? 'Expected value not to be a valid ODL event, but it was'
        : `Expected value to be a valid ODL event, but found errors:\n  - ${errors.join('\n  - ')}`,
  };
}

function toBeValidEventName(this: { isNot: boolean }, received: unknown) {
  if (typeof received !== 'string') {
    return {
      pass: false,
      message: () => `Expected a string event name, but received ${typeof received}`,
    };
  }

  const pass = EVENT_NAME_PATTERN.test(received);

  return {
    pass,
    message: () =>
      pass
        ? `Expected "${received}" not to be a valid event name, but it was`
        : `Expected "${received}" to be a valid event name (lowercase dot-namespaced, e.g. "page.view")`,
  };
}

function toHaveEventName(this: { isNot: boolean }, received: unknown, expectedName: string) {
  const event = received as Partial<CapturedEvent>;

  if (!isRecord(received)) {
    return {
      pass: false,
      message: () => 'Expected value to be an ODL event object',
    };
  }

  const pass = event.event === expectedName;

  return {
    pass,
    message: () =>
      pass
        ? `Expected event not to have name "${expectedName}", but it did`
        : `Expected event to have name "${expectedName}", but received "${String(event.event)}"`,
  };
}

function toHaveContext(this: { isNot: boolean }, received: unknown, key: string) {
  const event = received as Partial<CapturedEvent>;

  if (!isRecord(received)) {
    return {
      pass: false,
      message: () => 'Expected value to be an ODL event object',
    };
  }

  if (!isRecord(event.context)) {
    return {
      pass: false,
      message: () =>
        `Expected event to have context with key "${key}", but context is missing or not an object`,
    };
  }

  const pass = key in event.context;

  return {
    pass,
    message: () =>
      pass
        ? `Expected event context not to have key "${key}", but it did`
        : `Expected event context to have key "${key}", but it was not found. Available keys: ${Object.keys(event.context as Record<string, unknown>).join(', ')}`,
  };
}

function toHaveData(
  this: { isNot: boolean; equals: (a: unknown, b: unknown) => boolean },
  received: unknown,
  key: string,
  value?: unknown,
) {
  const event = received as Partial<CapturedEvent>;

  if (!isRecord(received)) {
    return {
      pass: false,
      message: () => 'Expected value to be an ODL event object',
    };
  }

  if (!isRecord(event.data)) {
    return {
      pass: false,
      message: () =>
        `Expected event to have data with key "${key}", but data is missing or not an object`,
    };
  }

  const hasKey = key in event.data;

  if (!hasKey) {
    return {
      pass: false,
      message: () =>
        `Expected event data to have key "${key}", but it was not found. Available keys: ${Object.keys(event.data as Record<string, unknown>).join(', ')}`,
    };
  }

  // If no value specified, just check key existence
  if (value === undefined) {
    return {
      pass: true,
      message: () => `Expected event data not to have key "${key}", but it did`,
    };
  }

  // Deep-equal check for value
  const actualValue = (event.data as Record<string, unknown>)[key];
  const pass = this.equals(actualValue, value);

  return {
    pass,
    message: () =>
      pass
        ? `Expected event data["${key}"] not to equal ${JSON.stringify(value)}, but it did`
        : `Expected event data["${key}"] to equal ${JSON.stringify(value)}, but received ${JSON.stringify(actualValue)}`,
  };
}

/** Install matchers into Vitest/Jest expect */
export function installMatchers(): void {
  // Works with both Vitest and Jest via expect.extend()
  if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
    expect.extend({
      toBeValidODLEvent,
      toBeValidEventName,
      toHaveEventName,
      toHaveContext,
      toHaveData,
    });
  }
}
