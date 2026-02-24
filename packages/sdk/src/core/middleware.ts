import type { ODLEvent } from './event-bus.js';

/**
 * A middleware function receives the current event and a `next` callback.
 *
 * - Call `next()` to pass control to the next middleware (or final handler).
 * - Omit the `next()` call to **cancel** the event (stop the chain).
 * - Mutate `event` in-place to transform it before downstream processing.
 */
export type MiddlewareFn = (event: ODLEvent, next: () => void) => void;

/**
 * Executes an ordered list of middleware functions as a pipeline.
 *
 * Each middleware can inspect/modify the event and decide whether to
 * continue the chain by calling `next()`.
 */
export class MiddlewarePipeline {
  private middlewares: MiddlewareFn[] = [];

  /**
   * Append a middleware to the pipeline.
   */
  use(fn: MiddlewareFn): void {
    this.middlewares.push(fn);
  }

  /**
   * Run the pipeline for a given event.
   *
   * After all middleware functions have called `next()`, the `finalHandler`
   * is invoked with the (potentially modified) event. If any middleware does
   * **not** call `next()`, neither subsequent middlewares nor the final
   * handler will execute.
   */
  execute(event: ODLEvent, finalHandler: (event: ODLEvent) => void): void {
    const fns = this.middlewares;
    let index = 0;

    const next = (): void => {
      if (index < fns.length) {
        const fn = fns[index];
        index++;
        if (fn) fn(event, next);
      } else {
        finalHandler(event);
      }
    };

    next();
  }
}
