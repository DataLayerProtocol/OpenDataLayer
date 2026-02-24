import { now } from '../utils/timestamp.js';
import { generateUUID } from '../utils/uuid.js';
import { ContextManager } from './context-manager.js';
import { EventBus } from './event-bus.js';
import type { ODLEvent } from './event-bus.js';
import { MiddlewarePipeline } from './middleware.js';
import type { MiddlewareFn } from './middleware.js';

/**
 * The core data layer that ties together event storage, the event bus,
 * the middleware pipeline, and ambient context management.
 */
export class DataLayer {
  private events: ODLEvent[] = [];
  private bus: EventBus;
  private middleware: MiddlewarePipeline;
  private contextManager: ContextManager;
  private source?: { name: string; version: string };

  constructor(source?: { name: string; version: string }) {
    this.bus = new EventBus();
    this.middleware = new MiddlewarePipeline();
    this.contextManager = new ContextManager();
    this.source = source;
  }

  // --------------------------------------------------------------------------
  // Event methods
  // --------------------------------------------------------------------------

  /**
   * Create, process, store, and emit an event.
   *
   * 1. Build the event object (id, timestamp, specVersion "1.0.0").
   * 2. Attach a snapshot of the current context.
   * 3. Run through the middleware pipeline.
   * 4. Store in the internal events array.
   * 5. Emit via the event bus.
   * 6. Return the event.
   *
   * If a middleware stops the chain (does not call `next()`), the event is
   * **not** stored or emitted and the method returns the event as it was at
   * that point (before storage/emission).
   */
  push(
    eventName: string,
    data?: Record<string, unknown>,
    customDimensions?: Record<string, string | number | boolean>,
  ): ODLEvent {
    const event: ODLEvent = {
      event: eventName,
      id: generateUUID(),
      timestamp: now(),
      specVersion: '1.0.0',
      context: this.contextManager.snapshot(),
      ...(data !== undefined ? { data } : {}),
      ...(customDimensions !== undefined ? { customDimensions } : {}),
      ...(this.source !== undefined ? { source: this.source } : {}),
    };

    // We track whether the final handler was reached so we can return the
    // event regardless of whether middleware allowed it through.
    let passed = false;

    this.middleware.execute(event, (processedEvent: ODLEvent) => {
      passed = true;
      this.events.push(processedEvent);
      this.bus.emit(processedEvent);
    });

    // If middleware cancelled, we still return the event object (useful for
    // inspection), but it will not appear in getEvents() / be emitted.
    if (!passed) {
      return event;
    }

    return event;
  }

  // --------------------------------------------------------------------------
  // Subscription
  // --------------------------------------------------------------------------

  /**
   * Subscribe to events matching a pattern.
   *
   * @returns An unsubscribe function.
   */
  on(pattern: string, handler: (event: ODLEvent) => void): () => void {
    return this.bus.on(pattern, handler);
  }

  // --------------------------------------------------------------------------
  // Middleware
  // --------------------------------------------------------------------------

  /**
   * Append a middleware function to the pipeline.
   */
  use(fn: MiddlewareFn): void {
    this.middleware.use(fn);
  }

  // --------------------------------------------------------------------------
  // Context
  // --------------------------------------------------------------------------

  getContext(): Record<string, unknown> {
    return this.contextManager.get();
  }

  setContext(key: string, value: unknown): void {
    this.contextManager.set(key, value);
  }

  updateContext(key: string, partial: Record<string, unknown>): void {
    this.contextManager.update(key, partial);
  }

  // --------------------------------------------------------------------------
  // Event access
  // --------------------------------------------------------------------------

  /**
   * Return an immutable view of all stored events.
   */
  getEvents(): readonly ODLEvent[] {
    return this.events;
  }

  /**
   * Return the most recently stored event, or `undefined` if none exist.
   */
  getLastEvent(): ODLEvent | undefined {
    return this.events[this.events.length - 1];
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /**
   * Clear all stored events and reset context.
   */
  reset(): void {
    this.events = [];
    this.contextManager.reset();
  }
}
