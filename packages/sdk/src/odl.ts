import { DataLayer } from './core/data-layer.js';
import type { ODLEvent } from './core/event-bus.js';
import type { MiddlewareFn } from './core/middleware.js';
import type { ODLPlugin } from './plugins/types.js';

/**
 * Configuration options for an {@link OpenDataLayer} instance.
 */
export interface ODLOptions {
  /** Plugins to register immediately on construction. */
  plugins?: ODLPlugin[];
  /** Initial ambient context (keyed by domain, e.g. `{ user: { id: '42' } }`). */
  context?: Record<string, unknown>;
  /** Source metadata attached to every event. */
  source?: { name: string; version: string };
}

/**
 * The public-facing API for the OpenDataLayer SDK.
 *
 * Wraps {@link DataLayer} and adds plugin lifecycle management, a friendlier
 * `track()` method, and centralised teardown via `destroy()`.
 */
export class OpenDataLayer {
  private dataLayer: DataLayer;
  private plugins: ODLPlugin[] = [];

  constructor(options?: ODLOptions) {
    this.dataLayer = new DataLayer(options?.source);

    // Wire up plugin beforeEvent / afterEvent hooks as middleware
    this.dataLayer.use((event, next) => {
      // Run all beforeEvent hooks.  If any returns null the event is cancelled.
      let current: ODLEvent | null = event;
      for (const plugin of this.plugins) {
        if (!current) break;
        if (plugin.beforeEvent) {
          current = plugin.beforeEvent(current);
        }
      }

      if (!current) {
        // A plugin cancelled the event — do not call next().
        return;
      }

      // Copy any mutations from the (possibly replaced) event back onto the
      // original reference so downstream middleware and the data layer see them.
      Object.assign(event, current);
      next();
    });

    // After-event hooks are fired via a wildcard subscription so they only
    // trigger for events that actually passed through the pipeline.
    this.dataLayer.on('*', (evt) => {
      for (const plugin of this.plugins) {
        if (plugin.afterEvent) {
          try {
            plugin.afterEvent(evt);
          } catch {
            // Isolate plugin errors
          }
        }
      }
    });

    // Apply initial context
    if (options?.context) {
      for (const [key, value] of Object.entries(options.context)) {
        this.dataLayer.setContext(key, value);
      }
    }

    // Register plugins provided via options
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        this.use(plugin);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Event methods
  // --------------------------------------------------------------------------

  /**
   * Track an event.
   *
   * Alias for the internal `DataLayer.push()`, exposed as the primary public API.
   */
  track(
    eventName: string,
    data?: Record<string, unknown>,
    customDimensions?: Record<string, string | number | boolean>,
  ): ODLEvent {
    return this.dataLayer.push(eventName, data, customDimensions);
  }

  // --------------------------------------------------------------------------
  // Context methods
  // --------------------------------------------------------------------------

  setContext(key: string, value: unknown): void {
    this.dataLayer.setContext(key, value);
  }

  updateContext(key: string, partial: Record<string, unknown>): void {
    this.dataLayer.updateContext(key, partial);
  }

  getContext(): Record<string, unknown> {
    return this.dataLayer.getContext();
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
    return this.dataLayer.on(pattern, handler);
  }

  // --------------------------------------------------------------------------
  // Plugin management
  // --------------------------------------------------------------------------

  /**
   * Register a plugin and call its `initialize` hook.
   */
  use(plugin: ODLPlugin): void {
    this.plugins.push(plugin);
    if (plugin.initialize) {
      plugin.initialize(this.dataLayer);
    }
  }

  // --------------------------------------------------------------------------
  // Middleware
  // --------------------------------------------------------------------------

  /**
   * Add a raw middleware function to the pipeline.
   *
   * Plugin authors should prefer the `beforeEvent` / `afterEvent` hooks;
   * `addMiddleware` is available for advanced use cases.
   */
  addMiddleware(fn: MiddlewareFn): void {
    this.dataLayer.use(fn);
  }

  // --------------------------------------------------------------------------
  // Utility
  // --------------------------------------------------------------------------

  /**
   * Return an immutable view of all stored events.
   */
  getEvents(): readonly ODLEvent[] {
    return this.dataLayer.getEvents();
  }

  /**
   * Clear all stored events and context.
   */
  reset(): void {
    this.dataLayer.reset();
  }

  /**
   * Tear down all plugins and clean up resources.
   */
  destroy(): void {
    for (const plugin of this.plugins) {
      if (plugin.destroy) {
        try {
          plugin.destroy();
        } catch {
          // Isolate plugin teardown errors
        }
      }
    }
    this.plugins = [];
    this.dataLayer.reset();
  }
}
