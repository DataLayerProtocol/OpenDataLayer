/**
 * Tests for @opendatalayer/adapter-adobe
 */

declare const globalThis: { window?: Record<string, unknown> };

import { adobeAdapter } from '../index.js';

function makeEvent(
  overrides: Partial<{
    event: string;
    id: string;
    timestamp: string;
    specVersion: string;
    context: Record<string, unknown>;
    data: Record<string, unknown>;
    customDimensions: Record<string, string | number | boolean>;
  }> = {},
) {
  return {
    event: 'test.event',
    id: 'test-id-123',
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

function makeMockS() {
  return {
    t: vi.fn(),
    tl: vi.fn(),
    clearVars: vi.fn(),
    events: '',
    products: '',
    pageName: '',
    channel: '',
    campaign: '',
    purchaseID: '',
    transactionID: '',
  };
}

function makeMockAlloy() {
  return vi.fn().mockResolvedValue({});
}

beforeEach(() => {
  globalThis.window = {} as any;
});

afterEach(() => {
  globalThis.window = undefined;
  vi.restoreAllMocks();
});

describe('adobeAdapter', () => {
  // ── Plugin structure ──────────────────────────────────────────────

  describe('plugin structure', () => {
    it('returns a plugin with name "adobe-adapter"', () => {
      const plugin = adobeAdapter();
      expect(plugin.name).toBe('adobe-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const plugin = adobeAdapter();
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });

    it('destroy can be called without error', () => {
      const plugin = adobeAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });

  // ── SSR safety ────────────────────────────────────────────────────

  describe('SSR safety', () => {
    it('does not error when window is undefined (initialize)', () => {
      globalThis.window = undefined;
      const plugin = adobeAdapter();
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
    });

    it('does not error when window is undefined (afterEvent)', () => {
      globalThis.window = undefined;
      const plugin = adobeAdapter();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
    });

    it('does not error when window is undefined (destroy)', () => {
      globalThis.window = undefined;
      const plugin = adobeAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });

    it('does not error when window is undefined in websdk mode', () => {
      globalThis.window = undefined;
      const plugin = adobeAdapter({ mode: 'websdk' });
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
    });
  });

  // ── AppMeasurement mode ───────────────────────────────────────────

  describe('AppMeasurement mode', () => {
    describe('initialize()', () => {
      it('warns when window.s is not found', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter();
        plugin.initialize?.(undefined);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('AppMeasurement (window.s) not found'),
        );
      });

      it('does not warn when window.s exists', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter();
        plugin.initialize?.(undefined);
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });

    describe('page view tracking', () => {
      it('calls s.t() for page.view events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
        expect(mockS.t).toHaveBeenCalledTimes(1);
        expect(mockS.tl).not.toHaveBeenCalled();
      });

      it('calls s.t() for page.virtual_view events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
        expect(mockS.t).toHaveBeenCalledTimes(1);
        expect(mockS.tl).not.toHaveBeenCalled();
      });
    });

    describe('link tracking', () => {
      it('calls s.tl(true, "o", eventName) for non-page events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
        expect(mockS.tl).toHaveBeenCalledWith(true, 'o', 'purchase');
        expect(mockS.t).not.toHaveBeenCalled();
      });

      it('uses dot-to-underscore fallback for unmapped events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'custom.my_event.fired' }));
        expect(mockS.tl).toHaveBeenCalledWith(true, 'o', 'custom_my_event_fired');
      });
    });

    describe('event name mapping', () => {
      it('maps ecommerce.product_viewed to prodView', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed' }));
        expect(mockS.events).toBe('prodView');
      });

      it('maps ecommerce.product_added to scAdd', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added' }));
        expect(mockS.events).toBe('scAdd');
      });

      it('maps ecommerce.purchase to purchase', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
        expect(mockS.events).toBe('purchase');
      });

      it('maps user.signed_up to event1', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'user.signed_up' }));
        expect(mockS.events).toBe('event1');
      });

      it('maps search.performed to event3', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
        expect(mockS.events).toBe('event3');
      });

      it('allows custom eventNameMap to override defaults', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({
          eventNameMap: { 'ecommerce.purchase': 'event50' },
        });
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
        expect(mockS.events).toBe('event50');
        expect(mockS.tl).toHaveBeenCalledWith(true, 'o', 'event50');
      });

      it('custom eventNameMap preserves non-overridden defaults', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({
          eventNameMap: { 'ecommerce.purchase': 'event50' },
        });
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added' }));
        expect(mockS.events).toBe('scAdd');
      });
    });

    describe('product string building', () => {
      it('builds product string from products array', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: {
              products: [{ category: 'Apparel', name: 'Blue Shirt', quantity: 2, price: 29.99 }],
            },
          }),
        );
        expect(mockS.products).toBe('Apparel;Blue Shirt;2;29.99');
      });

      it('builds product string for multiple products separated by comma', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: {
              products: [
                { category: 'Apparel', name: 'Blue Shirt', quantity: 2, price: 29.99 },
                { category: 'Shoes', name: 'Sneakers', quantity: 1, price: 89.0 },
              ],
            },
          }),
        );
        expect(mockS.products).toBe('Apparel;Blue Shirt;2;29.99,Shoes;Sneakers;1;89');
      });

      it('handles single product object (data.product)', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.product_viewed',
            data: {
              product: { category: 'Electronics', name: 'Widget', quantity: 1, price: 49.99 },
            },
          }),
        );
        expect(mockS.products).toBe('Electronics;Widget;1;49.99');
      });

      it('defaults quantity to 1 and price to empty when missing', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.product_added',
            data: {
              products: [{ name: 'Thing' }],
            },
          }),
        );
        expect(mockS.products).toBe(';Thing;1;');
      });

      it('uses product id when name is missing', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.product_added',
            data: {
              products: [{ id: 'SKU-123' }],
            },
          }),
        );
        expect(mockS.products).toBe(';SKU-123;1;');
      });
    });

    describe('page data mapping', () => {
      it('maps data.title to s.pageName', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { title: 'Home Page' } }));
        expect(mockS.pageName).toBe('Home Page');
      });

      it('maps data.name to s.pageName', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { name: 'About Us' } }));
        expect(mockS.pageName).toBe('About Us');
      });

      it('maps data.channel to s.channel', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ data: { channel: 'web' } }));
        expect(mockS.channel).toBe('web');
      });

      it('maps data.campaign to s.campaign', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ data: { campaign: 'spring-sale' } }));
        expect(mockS.campaign).toBe('spring-sale');
      });
    });

    describe('purchaseID and transactionID mapping', () => {
      it('maps data.orderId to s.purchaseID for ecommerce events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: { orderId: 'ORD-789' },
          }),
        );
        expect(mockS.purchaseID).toBe('ORD-789');
      });

      it('maps data.transactionId to s.transactionID for ecommerce events', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.checkout_started',
            data: { transactionId: 'TXN-456' },
          }),
        );
        expect(mockS.transactionID).toBe('TXN-456');
      });
    });

    describe('eVar and prop mapping from customDimensions', () => {
      it('maps customDimensions to eVars via eVarMap', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({ eVarMap: { userType: 'eVar1' } });
        plugin.afterEvent?.(makeEvent({ customDimensions: { userType: 'premium' } }));
        expect(mockS.eVar1).toBe('premium');
      });

      it('maps customDimensions to props via propMap', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({ propMap: { pageType: 'prop1' } });
        plugin.afterEvent?.(makeEvent({ customDimensions: { pageType: 'landing' } }));
        expect(mockS.prop1).toBe('landing');
      });

      it('maps same dimension to both eVar and prop simultaneously', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({
          eVarMap: { section: 'eVar5' },
          propMap: { section: 'prop5' },
        });
        plugin.afterEvent?.(makeEvent({ customDimensions: { section: 'sports' } }));
        expect(mockS.eVar5).toBe('sports');
        expect(mockS.prop5).toBe('sports');
      });

      it('converts numeric dimension values to strings', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({ eVarMap: { score: 'eVar10' } });
        plugin.afterEvent?.(makeEvent({ customDimensions: { score: 42 } }));
        expect(mockS.eVar10).toBe('42');
      });
    });

    describe('search query eVar mapping', () => {
      it('maps data.query to the searchQuery eVar', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({ eVarMap: { searchQuery: 'eVar20' } });
        plugin.afterEvent?.(
          makeEvent({
            event: 'search.performed',
            data: { query: 'blue widgets' },
          }),
        );
        expect(mockS.eVar20).toBe('blue widgets');
      });

      it('falls back to "query" key in eVarMap for search query', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter({ eVarMap: { query: 'eVar21' } });
        plugin.afterEvent?.(
          makeEvent({
            event: 'search.performed',
            data: { query: 'red shoes' },
          }),
        );
        expect(mockS.eVar21).toBe('red shoes');
      });
    });

    describe('clearVars', () => {
      it('calls s.clearVars() after tracking', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent());
        expect(mockS.clearVars).toHaveBeenCalledTimes(1);
      });

      it('calls s.clearVars() after s.t() for page views', () => {
        const mockS = makeMockS();
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
        // Verify clearVars is called after t
        const tCallOrder = mockS.t.mock.invocationCallOrder[0];
        const clearCallOrder = mockS.clearVars.mock.invocationCallOrder[0];
        expect(clearCallOrder).toBeGreaterThan(tCallOrder);
      });

      it('does not error when clearVars is not defined', () => {
        const mockS = makeMockS();
        (mockS as any).clearVars = undefined;
        (globalThis.window as any).s = mockS;
        const plugin = adobeAdapter();
        expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
      });
    });

    describe('warning when window.s is missing during afterEvent', () => {
      it('warns when window.s is not found on afterEvent', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter();
        plugin.afterEvent?.(makeEvent());
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('AppMeasurement (window.s) not found'),
        );
      });
    });
  });

  // ── WebSDK mode ───────────────────────────────────────────────────

  describe('WebSDK mode', () => {
    describe('initialize()', () => {
      it('warns when window.alloy is not found', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.initialize?.(undefined);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('AEP Web SDK (window.alloy) not found'),
        );
      });

      it('does not warn when window.alloy exists', () => {
        (globalThis.window as any).alloy = makeMockAlloy();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.initialize?.(undefined);
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });

    describe('sendEvent call', () => {
      it('calls alloy("sendEvent", { xdm }) on afterEvent', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent());
        expect(mockAlloy).toHaveBeenCalledTimes(1);
        expect(mockAlloy).toHaveBeenCalledWith(
          'sendEvent',
          expect.objectContaining({ xdm: expect.any(Object) }),
        );
      });

      it('warns when window.alloy is not found on afterEvent', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent());
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('AEP Web SDK (window.alloy) not found'),
        );
      });
    });

    describe('eventType mapping', () => {
      it('sets xdm.eventType to the mapped event name', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.eventType).toBe('purchase');
      });

      it('uses dot-to-underscore fallback for unmapped events', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent({ event: 'custom.my.event' }));
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.eventType).toBe('custom_my_event');
      });
    });

    describe('page details in xdm', () => {
      it('maps page event data to xdm.web.webPageDetails', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'page.view',
            data: { title: 'Home Page', url: 'https://example.com/' },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.web.webPageDetails.name).toBe('Home Page');
        expect(sentXdm.web.webPageDetails.URL).toBe('https://example.com/');
      });

      it('does not include web.webPageDetails for non-page events', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: { title: 'Checkout' },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.web).toBeUndefined();
      });
    });

    describe('commerce actions', () => {
      it('maps ecommerce.purchase to xdm.commerce.purchases', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: { orderId: 'ORD-1', total: 99.99, currency: 'USD' },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.commerce.purchases).toEqual({ value: 1 });
        expect(sentXdm.commerce.order.purchaseID).toBe('ORD-1');
        expect(sentXdm.commerce.order.priceTotal).toBe(99.99);
        expect(sentXdm.commerce.order.currencyCode).toBe('USD');
      });

      it('maps ecommerce.product_viewed to xdm.commerce.productViews', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed', data: {} }));
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.commerce.productViews).toEqual({ value: 1 });
      });

      it('maps ecommerce.checkout_started to xdm.commerce.checkouts', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent({ event: 'ecommerce.checkout_started', data: {} }));
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.commerce.checkouts).toEqual({ value: 1 });
      });
    });

    describe('productListItems mapping', () => {
      it('maps products to xdm.productListItems', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.product_viewed',
            data: {
              products: [
                { name: 'Widget', sku: 'SKU-1', quantity: 2, price: 19.99, category: 'Gadgets' },
              ],
            },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.productListItems).toHaveLength(1);
        const item = sentXdm.productListItems[0];
        expect(item.name).toBe('Widget');
        expect(item.SKU).toBe('SKU-1');
        expect(item.quantity).toBe(2);
        expect(item.priceTotal).toBe(19.99);
        expect(item.productCategories).toEqual({ primary: 'Gadgets' });
      });

      it('uses product.id as SKU when sku is missing', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.product_added',
            data: {
              products: [{ id: 'PROD-1', name: 'Gadget' }],
            },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.productListItems[0].SKU).toBe('PROD-1');
      });
    });

    describe('search phrase', () => {
      it('maps search.performed to xdm.siteSearch.phrase', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'search.performed',
            data: { query: 'blue widgets' },
          }),
        );
        const sentXdm = mockAlloy.mock.calls[0][1].xdm;
        expect(sentXdm.siteSearch).toEqual({ phrase: 'blue widgets' });
      });
    });

    describe('custom dimensions in data object', () => {
      it('includes customDimensions in the data object alongside xdm', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            customDimensions: { userType: 'premium', plan: 'annual' },
          }),
        );
        const sentData = mockAlloy.mock.calls[0][1].data;
        expect(sentData.userType).toBe('premium');
        expect(sentData.plan).toBe('annual');
      });

      it('includes non-ecommerce, non-page data fields in data object', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(
          makeEvent({
            event: 'custom.action',
            data: { buttonId: 'cta-1', label: 'Sign Up' },
          }),
        );
        const sentData = mockAlloy.mock.calls[0][1].data;
        expect(sentData.buttonId).toBe('cta-1');
        expect(sentData.label).toBe('Sign Up');
      });

      it('does not include data key when there are no additional data fields', () => {
        const mockAlloy = makeMockAlloy();
        (globalThis.window as any).alloy = mockAlloy;
        const plugin = adobeAdapter({ mode: 'websdk' });
        plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
        const sentOptions = mockAlloy.mock.calls[0][1];
        expect(sentOptions.data).toBeUndefined();
      });
    });
  });
});
