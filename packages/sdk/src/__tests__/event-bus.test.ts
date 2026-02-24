import { EventBus } from '../core/event-bus.js';
import type { ODLEvent } from '../core/event-bus.js';

function makeEvent(overrides: Partial<ODLEvent> = {}): ODLEvent {
  return {
    event: 'test.event',
    id: 'test-id',
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  // ---------------------------------------------------------------------------
  // on() return value
  // ---------------------------------------------------------------------------

  describe('on() returns an unsubscribe function', () => {
    it('returns a function', () => {
      const unsub = bus.on('test.event', () => {});
      expect(typeof unsub).toBe('function');
    });

    it('calling the unsubscribe function removes the handler', () => {
      const handler = vi.fn();
      const unsub = bus.on('test.event', handler);

      unsub();

      bus.emit(makeEvent({ event: 'test.event' }));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Exact match subscriptions
  // ---------------------------------------------------------------------------

  describe('exact match subscriptions', () => {
    it('fires handler when event name matches exactly', () => {
      const handler = vi.fn();
      bus.on('page.view', handler);

      const event = makeEvent({ event: 'page.view' });
      bus.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('does not fire handler when event name does not match', () => {
      const handler = vi.fn();
      bus.on('page.view', handler);

      bus.emit(makeEvent({ event: 'page.exit' }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Wildcard * catches everything
  // ---------------------------------------------------------------------------

  describe('wildcard "*" catches everything', () => {
    it('fires for any event', () => {
      const handler = vi.fn();
      bus.on('*', handler);

      bus.emit(makeEvent({ event: 'page.view' }));
      bus.emit(makeEvent({ event: 'ecommerce.purchase' }));
      bus.emit(makeEvent({ event: 'custom' }));

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Category wildcard
  // ---------------------------------------------------------------------------

  describe('category wildcard "category.*"', () => {
    it('matches events starting with the category prefix', () => {
      const handler = vi.fn();
      bus.on('ecommerce.*', handler);

      bus.emit(makeEvent({ event: 'ecommerce.purchase' }));
      bus.emit(makeEvent({ event: 'ecommerce.add_to_cart' }));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('does not match events from a different category', () => {
      const handler = vi.fn();
      bus.on('ecommerce.*', handler);

      bus.emit(makeEvent({ event: 'page.view' }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('does not match events with only the category prefix as a substring', () => {
      const handler = vi.fn();
      bus.on('eco.*', handler);

      // "ecommerce.purchase" starts with "eco." — no, it starts with "ecommerce."
      // so "eco.*" should NOT match "ecommerce.purchase" since the prefix is "eco."
      bus.emit(makeEvent({ event: 'ecommerce.purchase' }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple handlers for same pattern
  // ---------------------------------------------------------------------------

  describe('multiple handlers for the same pattern', () => {
    it('all handlers are called', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      bus.on('test.event', handler1);
      bus.on('test.event', handler2);
      bus.on('test.event', handler3);

      const event = makeEvent({ event: 'test.event' });
      bus.emit(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('handlers are called with the same event object', () => {
      const received: ODLEvent[] = [];
      const handler1 = (e: ODLEvent) => received.push(e);
      const handler2 = (e: ODLEvent) => received.push(e);

      bus.on('test.event', handler1);
      bus.on('test.event', handler2);

      const event = makeEvent({ event: 'test.event' });
      bus.emit(event);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(event);
      expect(received[1]).toBe(event);
    });
  });

  // ---------------------------------------------------------------------------
  // off() removes handler
  // ---------------------------------------------------------------------------

  describe('off() removes a handler', () => {
    it('handler no longer fires after off()', () => {
      const handler = vi.fn();
      bus.on('test.event', handler);

      bus.off('test.event', handler);
      bus.emit(makeEvent({ event: 'test.event' }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('only removes the specified handler, others still fire', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('test.event', handler1);
      bus.on('test.event', handler2);

      bus.off('test.event', handler1);
      bus.emit(makeEvent({ event: 'test.event' }));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('off() with non-registered handler is a no-op', () => {
      const handler = vi.fn();
      // off() on a pattern that was never registered should not throw
      expect(() => bus.off('unknown', handler)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Unsubscribe function removes handler
  // ---------------------------------------------------------------------------

  describe('unsubscribe function removes handler', () => {
    it('handler does not fire after unsubscribe is called', () => {
      const handler = vi.fn();
      const unsub = bus.on('test.event', handler);

      // Fires before unsubscribe
      bus.emit(makeEvent({ event: 'test.event' }));
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      // Does not fire after unsubscribe
      bus.emit(makeEvent({ event: 'test.event' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calling unsubscribe multiple times does not throw', () => {
      const handler = vi.fn();
      const unsub = bus.on('test.event', handler);

      unsub();
      expect(() => unsub()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // emit() calls matching handlers with event
  // ---------------------------------------------------------------------------

  describe('emit() calls matching handlers with the event', () => {
    it('passes the event object to the handler', () => {
      const handler = vi.fn();
      bus.on('test.event', handler);

      const event = makeEvent({ data: { amount: 42 } });
      bus.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('calls handlers for multiple matching patterns', () => {
      const exactHandler = vi.fn();
      const wildcardHandler = vi.fn();
      const categoryHandler = vi.fn();

      bus.on('test.event', exactHandler);
      bus.on('*', wildcardHandler);
      bus.on('test.*', categoryHandler);

      const event = makeEvent({ event: 'test.event' });
      bus.emit(event);

      expect(exactHandler).toHaveBeenCalledTimes(1);
      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(categoryHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Handler errors are swallowed
  // ---------------------------------------------------------------------------

  describe('handler errors are swallowed', () => {
    it('does not throw when a handler throws', () => {
      bus.on('test.event', () => {
        throw new Error('boom');
      });

      expect(() => bus.emit(makeEvent())).not.toThrow();
    });

    it('other handlers still run when one throws', () => {
      const handler1 = vi.fn(() => {
        throw new Error('boom');
      });
      const handler2 = vi.fn();

      bus.on('test.event', handler1);
      bus.on('test.event', handler2);

      bus.emit(makeEvent());

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // No handlers = no error on emit
  // ---------------------------------------------------------------------------

  describe('no handlers means no error on emit', () => {
    it('emitting with no handlers registered does not throw', () => {
      expect(() => bus.emit(makeEvent())).not.toThrow();
    });

    it('emitting after all handlers are removed does not throw', () => {
      const handler = vi.fn();
      const unsub = bus.on('test.event', handler);
      unsub();

      expect(() => bus.emit(makeEvent())).not.toThrow();
    });
  });
});
