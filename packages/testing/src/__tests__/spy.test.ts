import { ODLSpy } from '../spy.js';
import type { CapturedEvent } from '../spy.js';

function makeEvent(name: string, overrides: Partial<CapturedEvent> = {}): CapturedEvent {
  return {
    event: name,
    id: `id-${name}`,
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

describe('ODLSpy', () => {
  let spy: ODLSpy;

  beforeEach(() => {
    spy = new ODLSpy();
  });

  describe('getEvents()', () => {
    it('starts empty', () => {
      expect(spy.getEvents()).toEqual([]);
    });
  });

  describe('record()', () => {
    it('adds an event', () => {
      const event = makeEvent('page.view');
      spy.record(event);

      expect(spy.getEvents()).toHaveLength(1);
      expect(spy.getEvents()[0]).toBe(event);
    });
  });

  describe('count', () => {
    it('returns the number of captured events', () => {
      expect(spy.count).toBe(0);

      spy.record(makeEvent('page.view'));
      expect(spy.count).toBe(1);

      spy.record(makeEvent('click'));
      spy.record(makeEvent('form.submit'));
      expect(spy.count).toBe(3);
    });
  });

  describe('getLastEvent()', () => {
    it('returns the most recent event', () => {
      spy.record(makeEvent('first'));
      spy.record(makeEvent('second'));
      const last = makeEvent('third');
      spy.record(last);

      expect(spy.getLastEvent()).toBe(last);
    });

    it('returns undefined when empty', () => {
      expect(spy.getLastEvent()).toBeUndefined();
    });
  });

  describe('hasEvent()', () => {
    it('returns true if an event with the given name exists', () => {
      spy.record(makeEvent('page.view'));
      spy.record(makeEvent('ecommerce.purchase'));

      expect(spy.hasEvent('page.view')).toBe(true);
      expect(spy.hasEvent('ecommerce.purchase')).toBe(true);
    });

    it('returns false if no event with the given name is found', () => {
      spy.record(makeEvent('page.view'));

      expect(spy.hasEvent('ecommerce.purchase')).toBe(false);
      expect(spy.hasEvent('nonexistent')).toBe(false);
    });
  });

  describe('getByName()', () => {
    it('filters events by exact event name', () => {
      spy.record(makeEvent('page.view'));
      spy.record(makeEvent('ecommerce.purchase'));
      spy.record(makeEvent('page.view', { id: 'id-page.view-2' }));
      spy.record(makeEvent('click'));

      const results = spy.getByName('page.view');

      expect(results).toHaveLength(2);
      expect(results.every((e) => e.event === 'page.view')).toBe(true);
    });
  });

  describe('getByPattern()', () => {
    beforeEach(() => {
      spy.record(makeEvent('ecommerce.productView'));
      spy.record(makeEvent('ecommerce.purchase'));
      spy.record(makeEvent('ecommerce.cart.add'));
      spy.record(makeEvent('page.view'));
      spy.record(makeEvent('click'));
    });

    it('matches single-segment wildcard with ecommerce.*', () => {
      const results = spy.getByPattern('ecommerce.*');

      expect(results).toHaveLength(2);
      expect(results.map((e) => e.event)).toEqual(['ecommerce.productView', 'ecommerce.purchase']);
    });

    it('matches deeply nested events with **', () => {
      const results = spy.getByPattern('ecommerce.**');

      expect(results).toHaveLength(3);
      expect(results.map((e) => e.event)).toEqual([
        'ecommerce.productView',
        'ecommerce.purchase',
        'ecommerce.cart.add',
      ]);
    });

    it('matches exact string without wildcards', () => {
      const results = spy.getByPattern('click');

      expect(results).toHaveLength(1);
      expect(results[0]?.event).toBe('click');
    });
  });

  describe('clear()', () => {
    it('removes all captured events', () => {
      spy.record(makeEvent('page.view'));
      spy.record(makeEvent('click'));
      expect(spy.count).toBe(2);

      spy.clear();

      expect(spy.getEvents()).toEqual([]);
      expect(spy.count).toBe(0);
    });
  });

  describe('handler()', () => {
    it('returns a function that calls record', () => {
      const handler = spy.handler();
      expect(typeof handler).toBe('function');

      const event = makeEvent('page.view');
      handler(event);

      expect(spy.count).toBe(1);
      expect(spy.getEvents()[0]).toBe(event);
    });
  });

  describe('setUnsubscribe() and disconnect()', () => {
    it('disconnect calls the unsubscribe function', () => {
      const unsubscribe = vi.fn();
      spy.setUnsubscribe(unsubscribe);

      spy.disconnect();

      expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it('disconnect when no unsubscribe is set is a no-op', () => {
      expect(() => spy.disconnect()).not.toThrow();
    });

    it('disconnect clears the unsubscribe so subsequent calls are no-ops', () => {
      const unsubscribe = vi.fn();
      spy.setUnsubscribe(unsubscribe);

      spy.disconnect();
      spy.disconnect();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
