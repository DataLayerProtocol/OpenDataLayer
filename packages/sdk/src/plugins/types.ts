import type { DataLayer } from '../core/data-layer.js';
import type { ODLEvent } from '../core/event-bus.js';

/**
 * Plugin interface for extending OpenDataLayer behaviour.
 *
 * All methods are optional except `name`.
 */
export interface ODLPlugin {
  /** Unique plugin identifier. */
  name: string;

  /**
   * Called once when the plugin is registered with an OpenDataLayer instance.
   * Use this to set up subscriptions, add middleware, or read initial state.
   */
  initialize?(odl: DataLayer): void;

  /**
   * Called **before** an event is stored and emitted.
   *
   * - Return the (optionally modified) event to allow it through.
   * - Return `null` to **cancel** the event entirely.
   */
  beforeEvent?(event: ODLEvent): ODLEvent | null;

  /**
   * Called **after** an event has been stored and emitted.
   */
  afterEvent?(event: ODLEvent): void;

  /**
   * Called when the OpenDataLayer instance is destroyed. Clean up any
   * listeners, intervals, or external resources here.
   */
  destroy?(): void;
}
