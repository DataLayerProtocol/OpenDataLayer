import { DataLayer } from '../core/data-layer.js';
import type { ODLEvent } from '../core/event-bus.js';

describe('DataLayer', () => {
  let dl: DataLayer;

  beforeEach(() => {
    dl = new DataLayer();
  });

  // ---------------------------------------------------------------------------
  // push() creates event with id, timestamp, specVersion "1.0.0"
  // ---------------------------------------------------------------------------

  describe('push() creates event with standard fields', () => {
    it('creates an event with an id (UUID format)', () => {
      const event = dl.push('test.event');

      expect(event.id).toBeDefined();
      expect(event.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('creates an event with an ISO 8601 timestamp', () => {
      const event = dl.push('test.event');

      expect(event.timestamp).toBeDefined();
      // ISO 8601 pattern: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
    });

    it('creates an event with specVersion "1.0.0"', () => {
      const event = dl.push('test.event');
      expect(event.specVersion).toBe('1.0.0');
    });

    it('creates an event with the specified event name', () => {
      const event = dl.push('ecommerce.purchase');
      expect(event.event).toBe('ecommerce.purchase');
    });

    it('each push generates a unique id', () => {
      const event1 = dl.push('test.event');
      const event2 = dl.push('test.event');

      expect(event1.id).not.toBe(event2.id);
    });
  });

  // ---------------------------------------------------------------------------
  // push() attaches context snapshot
  // ---------------------------------------------------------------------------

  describe('push() attaches context snapshot', () => {
    it('includes a snapshot of the current context', () => {
      dl.setContext('user', { id: '42' });
      const event = dl.push('test.event');

      expect(event.context).toEqual({ user: { id: '42' } });
    });

    it('context snapshot is immutable (later context changes do not affect event)', () => {
      dl.setContext('user', { id: '42' });
      const event = dl.push('test.event');

      dl.setContext('user', { id: '99' });

      expect(event.context).toEqual({ user: { id: '42' } });
    });

    it('context is an empty object when no context has been set', () => {
      const event = dl.push('test.event');
      expect(event.context).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // push() stores event (retrievable via getEvents())
  // ---------------------------------------------------------------------------

  describe('push() stores event', () => {
    it('event is retrievable via getEvents()', () => {
      const event = dl.push('test.event');
      const events = dl.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event);
    });

    it('multiple events are stored in order', () => {
      const e1 = dl.push('first');
      const e2 = dl.push('second');
      const e3 = dl.push('third');

      const events = dl.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0]).toBe(e1);
      expect(events[1]).toBe(e2);
      expect(events[2]).toBe(e3);
    });
  });

  // ---------------------------------------------------------------------------
  // push() emits event on bus (handlers fire)
  // ---------------------------------------------------------------------------

  describe('push() emits event on bus', () => {
    it('handlers registered with on() are called', () => {
      const handler = vi.fn();
      dl.on('test.event', handler);

      dl.push('test.event');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handler receives the event object', () => {
      const handler = vi.fn();
      dl.on('test.event', handler);

      const event = dl.push('test.event');

      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  // ---------------------------------------------------------------------------
  // push() with data and customDimensions
  // ---------------------------------------------------------------------------

  describe('push() with data and customDimensions', () => {
    it('attaches data to the event', () => {
      const event = dl.push('ecommerce.purchase', { amount: 99.99, currency: 'USD' });

      expect(event.data).toEqual({ amount: 99.99, currency: 'USD' });
    });

    it('attaches customDimensions to the event', () => {
      const event = dl.push('page.view', undefined, { campaign: 'summer' });

      expect(event.customDimensions).toEqual({ campaign: 'summer' });
    });

    it('attaches both data and customDimensions', () => {
      const event = dl.push('ecommerce.purchase', { amount: 50 }, { source: 'email' });

      expect(event.data).toEqual({ amount: 50 });
      expect(event.customDimensions).toEqual({ source: 'email' });
    });

    it('omits data field when not provided', () => {
      const event = dl.push('test.event');
      expect(event).not.toHaveProperty('data');
    });

    it('omits customDimensions field when not provided', () => {
      const event = dl.push('test.event');
      expect(event).not.toHaveProperty('customDimensions');
    });
  });

  // ---------------------------------------------------------------------------
  // Source is attached if provided in constructor
  // ---------------------------------------------------------------------------

  describe('source metadata', () => {
    it('attaches source when provided in constructor', () => {
      const dlWithSource = new DataLayer({ name: 'my-app', version: '2.0.0' });
      const event = dlWithSource.push('test.event');

      expect(event.source).toEqual({ name: 'my-app', version: '2.0.0' });
    });

    it('does not attach source when not provided', () => {
      const event = dl.push('test.event');
      expect(event).not.toHaveProperty('source');
    });
  });

  // ---------------------------------------------------------------------------
  // on() with patterns works (delegates to EventBus)
  // ---------------------------------------------------------------------------

  describe('on() with patterns', () => {
    it('exact match works', () => {
      const handler = vi.fn();
      dl.on('test.event', handler);

      dl.push('test.event');
      dl.push('other.event');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('wildcard * matches all events', () => {
      const handler = vi.fn();
      dl.on('*', handler);

      dl.push('test.event');
      dl.push('other.event');

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('category wildcard matches events in that category', () => {
      const handler = vi.fn();
      dl.on('ecommerce.*', handler);

      dl.push('ecommerce.purchase');
      dl.push('ecommerce.add_to_cart');
      dl.push('page.view');

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('on() returns an unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = dl.on('test.event', handler);

      dl.push('test.event');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      dl.push('test.event');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // use() adds middleware
  // ---------------------------------------------------------------------------

  describe('use() adds middleware', () => {
    it('middleware is called on push()', () => {
      const middleware = vi.fn((_e: ODLEvent, next: () => void) => next());
      dl.use(middleware);

      dl.push('test.event');

      expect(middleware).toHaveBeenCalledTimes(1);
    });

    it('middleware receives the event', () => {
      let receivedEvent: ODLEvent | undefined;
      dl.use((event, next) => {
        receivedEvent = event;
        next();
      });

      dl.push('test.event');

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent?.event).toBe('test.event');
    });
  });

  // ---------------------------------------------------------------------------
  // Middleware can cancel event (not stored, not emitted)
  // ---------------------------------------------------------------------------

  describe('middleware can cancel event', () => {
    it('event is not stored when middleware does not call next()', () => {
      dl.use((_event, _next) => {
        // Cancel by not calling next()
      });

      dl.push('test.event');

      expect(dl.getEvents()).toHaveLength(0);
    });

    it('event is not emitted when middleware does not call next()', () => {
      const handler = vi.fn();
      dl.on('test.event', handler);

      dl.use((_event, _next) => {
        // Cancel by not calling next()
      });

      dl.push('test.event');

      expect(handler).not.toHaveBeenCalled();
    });

    it('push() still returns the event object even when cancelled', () => {
      dl.use((_event, _next) => {
        // Cancel
      });

      const event = dl.push('test.event');

      expect(event).toBeDefined();
      expect(event.event).toBe('test.event');
    });
  });

  // ---------------------------------------------------------------------------
  // setContext(), getContext(), updateContext()
  // ---------------------------------------------------------------------------

  describe('setContext(), getContext(), updateContext()', () => {
    it('setContext() and getContext() work', () => {
      dl.setContext('user', { id: '42' });
      expect(dl.getContext()).toEqual({ user: { id: '42' } });
    });

    it('updateContext() deep-merges into existing key', () => {
      dl.setContext('user', { id: '42', name: 'Alice' });
      dl.updateContext('user', { role: 'admin' });

      expect(dl.getContext().user).toEqual({
        id: '42',
        name: 'Alice',
        role: 'admin',
      });
    });

    it('updateContext() on non-existent key creates it', () => {
      dl.updateContext('session', { token: 'abc' });
      expect(dl.getContext().session).toEqual({ token: 'abc' });
    });
  });

  // ---------------------------------------------------------------------------
  // getLastEvent() returns most recent
  // ---------------------------------------------------------------------------

  describe('getLastEvent()', () => {
    it('returns undefined when no events exist', () => {
      expect(dl.getLastEvent()).toBeUndefined();
    });

    it('returns the most recently pushed event', () => {
      dl.push('first');
      const last = dl.push('second');

      expect(dl.getLastEvent()).toBe(last);
    });

    it('updates after each push', () => {
      dl.push('first');
      expect(dl.getLastEvent()?.event).toBe('first');

      dl.push('second');
      expect(dl.getLastEvent()?.event).toBe('second');
    });
  });

  // ---------------------------------------------------------------------------
  // reset() clears events and context
  // ---------------------------------------------------------------------------

  describe('reset()', () => {
    it('clears all stored events', () => {
      dl.push('test.event');
      dl.push('test.event');
      dl.reset();

      expect(dl.getEvents()).toHaveLength(0);
    });

    it('clears context', () => {
      dl.setContext('user', { id: '42' });
      dl.reset();

      expect(dl.getContext()).toEqual({});
    });

    it('getLastEvent() returns undefined after reset', () => {
      dl.push('test.event');
      dl.reset();

      expect(dl.getLastEvent()).toBeUndefined();
    });
  });
});
