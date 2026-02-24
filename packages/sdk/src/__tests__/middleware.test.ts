import type { ODLEvent } from '../core/event-bus.js';
import { MiddlewarePipeline } from '../core/middleware.js';

function makeEvent(overrides: Partial<ODLEvent> = {}): ODLEvent {
  return {
    event: 'test.event',
    id: 'test-id',
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

describe('MiddlewarePipeline', () => {
  let pipeline: MiddlewarePipeline;

  beforeEach(() => {
    pipeline = new MiddlewarePipeline();
  });

  // ---------------------------------------------------------------------------
  // Empty pipeline calls finalHandler directly
  // ---------------------------------------------------------------------------

  describe('empty pipeline', () => {
    it('calls finalHandler directly', () => {
      const finalHandler = vi.fn();
      const event = makeEvent();

      pipeline.execute(event, finalHandler);

      expect(finalHandler).toHaveBeenCalledTimes(1);
      expect(finalHandler).toHaveBeenCalledWith(event);
    });
  });

  // ---------------------------------------------------------------------------
  // Single middleware that calls next() - finalHandler runs
  // ---------------------------------------------------------------------------

  describe('single middleware that calls next()', () => {
    it('finalHandler runs', () => {
      const finalHandler = vi.fn();
      const event = makeEvent();

      pipeline.use((_event, next) => {
        next();
      });

      pipeline.execute(event, finalHandler);

      expect(finalHandler).toHaveBeenCalledTimes(1);
    });

    it('middleware receives the event', () => {
      const middleware = vi.fn((_event: ODLEvent, next: () => void) => {
        next();
      });

      const event = makeEvent();
      pipeline.use(middleware);
      pipeline.execute(event, vi.fn());

      expect(middleware).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  // ---------------------------------------------------------------------------
  // Single middleware that doesn't call next() - finalHandler is skipped
  // ---------------------------------------------------------------------------

  describe('single middleware that does not call next()', () => {
    it('finalHandler is skipped', () => {
      const finalHandler = vi.fn();

      pipeline.use((_event, _next) => {
        // intentionally not calling next()
      });

      pipeline.execute(makeEvent(), finalHandler);

      expect(finalHandler).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple middleware execute in order
  // ---------------------------------------------------------------------------

  describe('multiple middleware execute in order', () => {
    it('middleware functions run in the order they were added', () => {
      const order: number[] = [];

      pipeline.use((_event, next) => {
        order.push(1);
        next();
      });

      pipeline.use((_event, next) => {
        order.push(2);
        next();
      });

      pipeline.use((_event, next) => {
        order.push(3);
        next();
      });

      pipeline.execute(makeEvent(), () => {
        order.push(4); // finalHandler
      });

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('all middleware and finalHandler fire when all call next()', () => {
      const mw1 = vi.fn((_e: ODLEvent, next: () => void) => next());
      const mw2 = vi.fn((_e: ODLEvent, next: () => void) => next());
      const finalHandler = vi.fn();

      pipeline.use(mw1);
      pipeline.use(mw2);
      pipeline.execute(makeEvent(), finalHandler);

      expect(mw1).toHaveBeenCalledTimes(1);
      expect(mw2).toHaveBeenCalledTimes(1);
      expect(finalHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Middleware can mutate event before calling next()
  // ---------------------------------------------------------------------------

  describe('middleware can mutate event before calling next()', () => {
    it('mutations are visible to subsequent middleware', () => {
      pipeline.use((event, next) => {
        event.data = { enriched: true };
        next();
      });

      const receivedData: Record<string, unknown>[] = [];
      pipeline.use((event, next) => {
        if (event.data) {
          receivedData.push({ ...event.data });
        }
        next();
      });

      pipeline.execute(makeEvent(), vi.fn());

      expect(receivedData).toEqual([{ enriched: true }]);
    });

    it('mutations are visible to finalHandler', () => {
      pipeline.use((event, next) => {
        event.customDimensions = { campaign: 'summer' };
        next();
      });

      const finalHandler = vi.fn();
      pipeline.execute(makeEvent(), finalHandler);

      const receivedEvent = finalHandler.mock.calls[0]?.[0] as ODLEvent;
      expect(receivedEvent.customDimensions).toEqual({ campaign: 'summer' });
    });
  });

  // ---------------------------------------------------------------------------
  // Chain stops when any middleware doesn't call next()
  // ---------------------------------------------------------------------------

  describe('chain stops when any middleware does not call next()', () => {
    it('second middleware that skips next() prevents finalHandler', () => {
      const order: string[] = [];

      pipeline.use((_event, next) => {
        order.push('mw1');
        next();
      });

      pipeline.use((_event, _next) => {
        order.push('mw2-cancel');
        // intentionally not calling next()
      });

      pipeline.use((_event, next) => {
        order.push('mw3');
        next();
      });

      const finalHandler = vi.fn(() => {
        order.push('final');
      });

      pipeline.execute(makeEvent(), finalHandler);

      expect(order).toEqual(['mw1', 'mw2-cancel']);
      expect(finalHandler).not.toHaveBeenCalled();
    });

    it('first middleware that skips next() stops entire chain', () => {
      const mw1 = vi.fn((_e: ODLEvent, _next: () => void) => {
        // intentionally not calling next()
      });
      const mw2 = vi.fn((_e: ODLEvent, next: () => void) => next());
      const finalHandler = vi.fn();

      pipeline.use(mw1);
      pipeline.use(mw2);
      pipeline.execute(makeEvent(), finalHandler);

      expect(mw1).toHaveBeenCalledTimes(1);
      expect(mw2).not.toHaveBeenCalled();
      expect(finalHandler).not.toHaveBeenCalled();
    });
  });
});
