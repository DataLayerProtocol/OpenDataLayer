import { deepMerge } from '../utils/deep-merge.js';

/**
 * Manages ambient context that is automatically attached to every event.
 *
 * Context is stored as a flat map of **keys** to arbitrary values. Each key
 * typically represents a context domain (e.g. `"page"`, `"user"`, `"session"`).
 */
export class ContextManager {
  private context: Record<string, unknown> = {};

  /**
   * Return the full context object (by reference).
   * Prefer {@link snapshot} when you need an immutable copy.
   */
  get(): Record<string, unknown> {
    return this.context;
  }

  /**
   * Set a top-level context key to the given value, replacing any previous
   * value stored under that key.
   */
  set(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * Deep-merge `partial` into the existing value stored under `key`.
   *
   * If the key does not yet exist, the partial is used as the initial value.
   */
  update(key: string, partial: Record<string, unknown>): void {
    const existing = this.context[key];
    if (
      existing !== null &&
      existing !== undefined &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      this.context[key] = deepMerge(existing as Record<string, unknown>, partial);
    } else {
      this.context[key] = { ...partial };
    }
  }

  /**
   * Remove a top-level key from the context.
   */
  remove(key: string): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.context[key];
  }

  /**
   * Clear all context.
   */
  reset(): void {
    this.context = {};
  }

  /**
   * Return a deep clone of the current context so that later mutations do
   * not affect the returned object.
   */
  snapshot(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.context)) as Record<string, unknown>;
  }
}
