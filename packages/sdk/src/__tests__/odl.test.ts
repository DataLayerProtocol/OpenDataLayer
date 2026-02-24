import type { DataLayer } from '../core/data-layer.js';
import type { ODLEvent } from '../core/event-bus.js';
import { OpenDataLayer } from '../odl.js';
import type { ODLPlugin } from '../plugins/types.js';

describe('OpenDataLayer', () => {
  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('works with no options', () => {
      const odl = new OpenDataLayer();
      expect(odl).toBeDefined();
      expect(odl.getEvents()).toHaveLength(0);
    });

    it('sets initial context when provided', () => {
      const odl = new OpenDataLayer({
        context: { user: { id: '42' }, page: { url: '/home' } },
      });

      expect(odl.getContext()).toEqual({
        user: { id: '42' },
        page: { url: '/home' },
      });
    });

    it('attaches source metadata to events', () => {
      const odl = new OpenDataLayer({
        source: { name: 'my-app', version: '1.0.0' },
      });

      const event = odl.track('test.event');
      expect(event.source).toEqual({ name: 'my-app', version: '1.0.0' });
    });

    it('calls initialize on plugins provided in constructor', () => {
      const initSpy = vi.fn();
      const plugin: ODLPlugin = {
        name: 'test-plugin',
        initialize: initSpy,
      };

      new OpenDataLayer({ plugins: [plugin] });

      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('calls initialize on multiple plugins in order', () => {
      const order: string[] = [];

      const plugin1: ODLPlugin = {
        name: 'first',
        initialize: () => order.push('first'),
      };
      const plugin2: ODLPlugin = {
        name: 'second',
        initialize: () => order.push('second'),
      };

      new OpenDataLayer({ plugins: [plugin1, plugin2] });

      expect(order).toEqual(['first', 'second']);
    });
  });

  // ---------------------------------------------------------------------------
  // track()
  // ---------------------------------------------------------------------------

  describe('track()', () => {
    it('creates and returns an event', () => {
      const odl = new OpenDataLayer();
      const event = odl.track('page.view');

      expect(event).toBeDefined();
      expect(event.event).toBe('page.view');
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.specVersion).toBe('1.0.0');
    });

    it('includes data and customDimensions', () => {
      const odl = new OpenDataLayer();
      const event = odl.track('ecommerce.purchase', { amount: 99.99 }, { campaign: 'summer' });

      expect(event.data).toEqual({ amount: 99.99 });
      expect(event.customDimensions).toEqual({ campaign: 'summer' });
    });

    it('stores the event in getEvents()', () => {
      const odl = new OpenDataLayer();
      const event = odl.track('test.event');

      expect(odl.getEvents()).toHaveLength(1);
      expect(odl.getEvents()[0]).toBe(event);
    });

    it('includes context snapshot', () => {
      const odl = new OpenDataLayer({
        context: { user: { id: '42' } },
      });

      const event = odl.track('test.event');
      expect(event.context).toEqual({ user: { id: '42' } });
    });
  });

  // ---------------------------------------------------------------------------
  // Context methods
  // ---------------------------------------------------------------------------

  describe('setContext() / getContext() / updateContext()', () => {
    it('setContext() stores and getContext() retrieves', () => {
      const odl = new OpenDataLayer();
      odl.setContext('user', { id: '42' });

      expect(odl.getContext()).toEqual({ user: { id: '42' } });
    });

    it('updateContext() deep-merges', () => {
      const odl = new OpenDataLayer();
      odl.setContext('user', { id: '42', name: 'Alice' });
      odl.updateContext('user', { role: 'admin' });

      expect(odl.getContext().user).toEqual({
        id: '42',
        name: 'Alice',
        role: 'admin',
      });
    });

    it('context changes are reflected in subsequent events', () => {
      const odl = new OpenDataLayer();
      odl.setContext('page', { url: '/a' });
      const e1 = odl.track('page.view');

      odl.setContext('page', { url: '/b' });
      const e2 = odl.track('page.view');

      expect(e1.context).toEqual({ page: { url: '/a' } });
      expect(e2.context).toEqual({ page: { url: '/b' } });
    });
  });

  // ---------------------------------------------------------------------------
  // on() subscriptions
  // ---------------------------------------------------------------------------

  describe('on() subscriptions', () => {
    it('fires correctly for matching events', () => {
      const odl = new OpenDataLayer();
      const handler = vi.fn();
      odl.on('page.view', handler);

      odl.track('page.view');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not fire for non-matching events', () => {
      const odl = new OpenDataLayer();
      const handler = vi.fn();
      odl.on('page.view', handler);

      odl.track('ecommerce.purchase');

      expect(handler).not.toHaveBeenCalled();
    });

    it('wildcard subscription works', () => {
      const odl = new OpenDataLayer();
      const handler = vi.fn();
      odl.on('*', handler);

      odl.track('page.view');
      odl.track('ecommerce.purchase');

      // Note: the ODL constructor also registers a '*' handler for afterEvent,
      // but our handler should still fire for each track call
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('returns an unsubscribe function', () => {
      const odl = new OpenDataLayer();
      const handler = vi.fn();
      const unsub = odl.on('test.event', handler);

      odl.track('test.event');
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      odl.track('test.event');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // use() registers plugin and calls initialize
  // ---------------------------------------------------------------------------

  describe('use() registers plugin', () => {
    it('calls initialize with the DataLayer', () => {
      const odl = new OpenDataLayer();
      const initSpy = vi.fn();
      const plugin: ODLPlugin = { name: 'test', initialize: initSpy };

      odl.use(plugin);

      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('works with a plugin that has no initialize', () => {
      const odl = new OpenDataLayer();
      const plugin: ODLPlugin = { name: 'minimal' };

      expect(() => odl.use(plugin)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Plugin beforeEvent can modify event
  // ---------------------------------------------------------------------------

  describe('plugin beforeEvent can modify event', () => {
    it('modifications are reflected in the stored event', () => {
      const plugin: ODLPlugin = {
        name: 'enricher',
        beforeEvent(event) {
          return { ...event, data: { ...event.data, enriched: true } };
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      const event = odl.track('test.event', { original: true });

      expect(event.data).toEqual({ original: true, enriched: true });
    });

    it('modifications propagate to on() handlers', () => {
      const plugin: ODLPlugin = {
        name: 'tagger',
        beforeEvent(event) {
          return { ...event, customDimensions: { tagged: true } };
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      const handler = vi.fn();
      odl.on('test.event', handler);

      odl.track('test.event');

      const received = handler.mock.calls[0]?.[0] as ODLEvent;
      expect(received.customDimensions).toEqual({ tagged: true });
    });
  });

  // ---------------------------------------------------------------------------
  // Plugin beforeEvent returning null cancels event
  // ---------------------------------------------------------------------------

  describe('plugin beforeEvent returning null cancels event', () => {
    it('event is not stored', () => {
      const plugin: ODLPlugin = {
        name: 'blocker',
        beforeEvent() {
          return null;
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      odl.track('blocked.event');

      expect(odl.getEvents()).toHaveLength(0);
    });

    it('event is not emitted to on() handlers', () => {
      const plugin: ODLPlugin = {
        name: 'blocker',
        beforeEvent() {
          return null;
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      const handler = vi.fn();
      odl.on('blocked.event', handler);

      odl.track('blocked.event');

      expect(handler).not.toHaveBeenCalled();
    });

    it('only the first plugin returning null is needed to cancel', () => {
      const secondPluginBeforeEvent = vi.fn((event: ODLEvent) => event);

      const plugin1: ODLPlugin = {
        name: 'canceller',
        beforeEvent() {
          return null;
        },
      };

      const plugin2: ODLPlugin = {
        name: 'passthrough',
        beforeEvent: secondPluginBeforeEvent,
      };

      const odl = new OpenDataLayer({ plugins: [plugin1, plugin2] });
      odl.track('test.event');

      // Second plugin should not have been called because first returned null
      expect(secondPluginBeforeEvent).not.toHaveBeenCalled();
      expect(odl.getEvents()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Plugin afterEvent fires after event stored
  // ---------------------------------------------------------------------------

  describe('plugin afterEvent fires after event stored', () => {
    it('afterEvent is called with the event', () => {
      const afterSpy = vi.fn();
      const plugin: ODLPlugin = {
        name: 'logger',
        afterEvent: afterSpy,
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      const event = odl.track('test.event');

      expect(afterSpy).toHaveBeenCalledTimes(1);
      expect(afterSpy).toHaveBeenCalledWith(event);
    });

    it('afterEvent only fires for events that pass through pipeline', () => {
      const afterSpy = vi.fn();

      const blocker: ODLPlugin = {
        name: 'blocker',
        beforeEvent() {
          return null;
        },
      };

      const logger: ODLPlugin = {
        name: 'logger',
        afterEvent: afterSpy,
      };

      const odl = new OpenDataLayer({ plugins: [blocker, logger] });
      odl.track('blocked.event');

      expect(afterSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Plugin afterEvent errors are isolated
  // ---------------------------------------------------------------------------

  describe('plugin afterEvent errors are isolated', () => {
    it('error in afterEvent does not throw', () => {
      const plugin: ODLPlugin = {
        name: 'broken-after',
        afterEvent() {
          throw new Error('afterEvent boom');
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });

      expect(() => odl.track('test.event')).not.toThrow();
    });

    it('other plugins afterEvent still runs despite one throwing', () => {
      const secondAfterSpy = vi.fn();

      const broken: ODLPlugin = {
        name: 'broken',
        afterEvent() {
          throw new Error('boom');
        },
      };

      const healthy: ODLPlugin = {
        name: 'healthy',
        afterEvent: secondAfterSpy,
      };

      const odl = new OpenDataLayer({ plugins: [broken, healthy] });
      odl.track('test.event');

      expect(secondAfterSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // addMiddleware() adds custom middleware
  // ---------------------------------------------------------------------------

  describe('addMiddleware()', () => {
    it('adds a custom middleware that runs on track()', () => {
      const odl = new OpenDataLayer();
      const mw = vi.fn((_e: ODLEvent, next: () => void) => next());

      odl.addMiddleware(mw);
      odl.track('test.event');

      expect(mw).toHaveBeenCalledTimes(1);
    });

    it('custom middleware can cancel events', () => {
      const odl = new OpenDataLayer();

      odl.addMiddleware((_event, _next) => {
        // Don't call next() => cancel
      });

      odl.track('test.event');

      expect(odl.getEvents()).toHaveLength(0);
    });

    it('custom middleware can mutate events', () => {
      const odl = new OpenDataLayer();

      odl.addMiddleware((event, next) => {
        event.customDimensions = { ...event.customDimensions, injected: true };
        next();
      });

      const event = odl.track('test.event');

      expect(event.customDimensions).toEqual({ injected: true });
    });
  });

  // ---------------------------------------------------------------------------
  // getEvents() returns stored events
  // ---------------------------------------------------------------------------

  describe('getEvents()', () => {
    it('returns empty array initially', () => {
      const odl = new OpenDataLayer();
      expect(odl.getEvents()).toHaveLength(0);
    });

    it('returns all tracked events', () => {
      const odl = new OpenDataLayer();
      odl.track('first');
      odl.track('second');
      odl.track('third');

      const events = odl.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0]?.event).toBe('first');
      expect(events[1]?.event).toBe('second');
      expect(events[2]?.event).toBe('third');
    });
  });

  // ---------------------------------------------------------------------------
  // reset() clears state
  // ---------------------------------------------------------------------------

  describe('reset()', () => {
    it('clears all stored events', () => {
      const odl = new OpenDataLayer();
      odl.track('test.event');
      odl.track('test.event');

      odl.reset();

      expect(odl.getEvents()).toHaveLength(0);
    });

    it('clears context', () => {
      const odl = new OpenDataLayer();
      odl.setContext('user', { id: '42' });

      odl.reset();

      expect(odl.getContext()).toEqual({});
    });

    it('new events after reset start fresh', () => {
      const odl = new OpenDataLayer();
      odl.setContext('user', { id: '42' });
      odl.track('before-reset');

      odl.reset();

      const event = odl.track('after-reset');
      expect(event.context).toEqual({});
      expect(odl.getEvents()).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------

  describe('destroy()', () => {
    it('calls destroy() on all plugins', () => {
      const destroy1 = vi.fn();
      const destroy2 = vi.fn();

      const plugin1: ODLPlugin = { name: 'p1', destroy: destroy1 };
      const plugin2: ODLPlugin = { name: 'p2', destroy: destroy2 };

      const odl = new OpenDataLayer({ plugins: [plugin1, plugin2] });
      odl.destroy();

      expect(destroy1).toHaveBeenCalledTimes(1);
      expect(destroy2).toHaveBeenCalledTimes(1);
    });

    it('clears the plugins list (destroy not called again on second destroy)', () => {
      const destroySpy = vi.fn();
      const plugin: ODLPlugin = { name: 'p', destroy: destroySpy };

      const odl = new OpenDataLayer({ plugins: [plugin] });
      odl.destroy();
      odl.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it('clears events and context', () => {
      const odl = new OpenDataLayer();
      odl.setContext('user', { id: '42' });
      odl.track('test.event');

      odl.destroy();

      expect(odl.getEvents()).toHaveLength(0);
      expect(odl.getContext()).toEqual({});
    });

    it('isolates errors from plugin destroy()', () => {
      const plugin: ODLPlugin = {
        name: 'broken',
        destroy() {
          throw new Error('destroy boom');
        },
      };

      const odl = new OpenDataLayer({ plugins: [plugin] });

      expect(() => odl.destroy()).not.toThrow();
    });

    it('other plugin destroy() still called when one throws', () => {
      const secondDestroy = vi.fn();

      const broken: ODLPlugin = {
        name: 'broken',
        destroy() {
          throw new Error('boom');
        },
      };

      const healthy: ODLPlugin = {
        name: 'healthy',
        destroy: secondDestroy,
      };

      const odl = new OpenDataLayer({ plugins: [broken, healthy] });
      odl.destroy();

      expect(secondDestroy).toHaveBeenCalledTimes(1);
    });

    it('works with plugins that have no destroy method', () => {
      const plugin: ODLPlugin = { name: 'minimal' };
      const odl = new OpenDataLayer({ plugins: [plugin] });

      expect(() => odl.destroy()).not.toThrow();
    });
  });
});
