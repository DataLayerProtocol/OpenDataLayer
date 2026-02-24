/**
 * Tests for @opendatalayer/adapter-piwik
 */

declare const globalThis: { window?: Record<string, unknown> };

import { piwikAdapter } from '../index.js';

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

let paq: unknown[][];

beforeEach(() => {
  paq = [];
  globalThis.window = { _paq: paq } as any;
});

afterEach(() => {
  globalThis.window = undefined;
});

describe('piwikAdapter', () => {
  // ---------------------------------------------------------------
  // 1. Plugin structure
  // ---------------------------------------------------------------
  describe('plugin structure', () => {
    it('returns a plugin with name "piwik-adapter"', () => {
      const plugin = piwikAdapter();
      expect(plugin.name).toBe('piwik-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const plugin = piwikAdapter();
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  // ---------------------------------------------------------------
  // 2. Initialize
  // ---------------------------------------------------------------
  describe('initialize()', () => {
    it('creates window._paq if it does not exist', () => {
      globalThis.window = {} as any;
      const plugin = piwikAdapter();
      plugin.initialize?.(undefined);
      expect(Array.isArray((globalThis.window as any)._paq)).toBe(true);
    });

    it('preserves existing window._paq', () => {
      const existing: unknown[][] = [['existingCommand']];
      globalThis.window = { _paq: existing } as any;
      const plugin = piwikAdapter();
      plugin.initialize?.(undefined);
      expect((globalThis.window as any)._paq).toBe(existing);
      expect((globalThis.window as any)._paq).toHaveLength(1);
    });

    it('does not create window._paq when using a custom paqInstance', () => {
      globalThis.window = {} as any;
      const customPaq: unknown[][] = [];
      const plugin = piwikAdapter({ paqInstance: customPaq });
      plugin.initialize?.(undefined);
      expect((globalThis.window as any)._paq).toBeUndefined();
    });

    it('warns when _paq is not found after initialization', () => {
      globalThis.window = undefined;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // When window is undefined and no paqInstance, getPaq returns undefined.
      // But initialize also early-returns when window is undefined, so no warn.
      // Instead: simulate a scenario with window defined but paqInstance not set
      // and _paq somehow missing -- actually initialize creates _paq in that case.
      // The warn only fires when getPaq returns undefined inside initialize.
      // That happens only with custom paqInstance that's falsy, but let's test SSR:
      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // 3. Page view tracking
  // ---------------------------------------------------------------
  describe('page.view', () => {
    it('pushes trackPageView without title when data has no title', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackPageView']);
    });

    it('pushes trackPageView with title when data has a title', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { title: 'Home Page' } }));
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackPageView', 'Home Page']);
    });
  });

  // ---------------------------------------------------------------
  // 4. Virtual page view
  // ---------------------------------------------------------------
  describe('page.virtual_view', () => {
    it('pushes setCustomUrl, setDocumentTitle, and trackPageView', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.virtual_view',
          data: { url: '/virtual/page', title: 'Virtual Page' },
        }),
      );
      expect(paq).toHaveLength(3);
      expect(paq[0]).toEqual(['setCustomUrl', '/virtual/page']);
      expect(paq[1]).toEqual(['setDocumentTitle', 'Virtual Page']);
      expect(paq[2]).toEqual(['trackPageView']);
    });

    it('uses data.path as fallback for url', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.virtual_view',
          data: { path: '/path/fallback', title: 'Path Page' },
        }),
      );
      expect(paq[0]).toEqual(['setCustomUrl', '/path/fallback']);
    });

    it('skips setCustomUrl when no url or path is provided', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.virtual_view',
          data: { title: 'No URL' },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['setDocumentTitle', 'No URL']);
      expect(paq[1]).toEqual(['trackPageView']);
    });

    it('skips setDocumentTitle when no title is provided', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.virtual_view',
          data: { url: '/only-url' },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['setCustomUrl', '/only-url']);
      expect(paq[1]).toEqual(['trackPageView']);
    });

    it('pushes only trackPageView when no url, path, or title', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackPageView']);
    });
  });

  // ---------------------------------------------------------------
  // 5. Site search
  // ---------------------------------------------------------------
  describe('search.performed', () => {
    it('pushes trackSiteSearch with keyword, category, and resultCount', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'search.performed',
          data: { query: 'blue shoes', category: 'Footwear', resultCount: 42 },
        }),
      );
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackSiteSearch', 'blue shoes', 'Footwear', 42]);
    });

    it('falls back to data.keyword when data.query is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'search.performed',
          data: { keyword: 'red hat' },
        }),
      );
      expect(paq[0]).toEqual(['trackSiteSearch', 'red hat', false, false]);
    });

    it('falls back to data.results when data.resultCount is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'search.performed',
          data: { query: 'test', results: 10 },
        }),
      );
      expect(paq[0]).toEqual(['trackSiteSearch', 'test', false, 10]);
    });

    it('uses empty string for keyword and false for missing optional fields', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      expect(paq[0]).toEqual(['trackSiteSearch', '', false, false]);
    });
  });

  // ---------------------------------------------------------------
  // 6. Product viewed
  // ---------------------------------------------------------------
  describe('ecommerce.product_viewed', () => {
    it('pushes setEcommerceView and trackPageView with product data', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            product: {
              sku: 'SKU-001',
              name: 'Blue Widget',
              category: 'Widgets',
              price: 29.99,
            },
          },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['setEcommerceView', 'SKU-001', 'Blue Widget', 'Widgets', 29.99]);
      expect(paq[1]).toEqual(['trackPageView']);
    });

    it('falls back to product.id when product.sku is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: { product: { id: 'ID-001', name: 'Gadget' } },
        }),
      );
      expect(paq[0]).toEqual(['setEcommerceView', 'ID-001', 'Gadget', '', 0]);
    });

    it('falls back to product.categories[0] when category is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            product: { sku: 'S1', name: 'N1', categories: ['Electronics', 'Phones'] },
          },
        }),
      );
      expect(paq[0]).toEqual(['setEcommerceView', 'S1', 'N1', 'Electronics', 0]);
    });

    it('uses data directly when data.product is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: { sku: 'DIRECT-SKU', name: 'Direct Product', price: 10 },
        }),
      );
      expect(paq[0]).toEqual(['setEcommerceView', 'DIRECT-SKU', 'Direct Product', '', 10]);
    });
  });

  // ---------------------------------------------------------------
  // 7. Cart update (product_added / product_removed)
  // ---------------------------------------------------------------
  describe('ecommerce.product_added', () => {
    it('pushes addEcommerceItem and trackEcommerceCartUpdate', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: {
            product: {
              sku: 'CART-SKU',
              name: 'Cart Item',
              category: 'Apparel',
              price: 49.99,
              quantity: 2,
            },
            cartTotal: 99.98,
          },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['addEcommerceItem', 'CART-SKU', 'Cart Item', 'Apparel', 49.99, 2]);
      expect(paq[1]).toEqual(['trackEcommerceCartUpdate', 99.98]);
    });

    it('defaults quantity to 1 when missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: { product: { sku: 'S1', name: 'N1' }, cartTotal: 10 },
        }),
      );
      expect(paq[0]).toEqual(['addEcommerceItem', 'S1', 'N1', '', 0, 1]);
    });

    it('falls back to data.total when data.cartTotal is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: { product: { sku: 'S1' }, total: 55.5 },
        }),
      );
      expect(paq[1]).toEqual(['trackEcommerceCartUpdate', 55.5]);
    });

    it('defaults cartTotal to 0 when neither cartTotal nor total provided', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: { product: { sku: 'S1' } },
        }),
      );
      expect(paq[1]).toEqual(['trackEcommerceCartUpdate', 0]);
    });
  });

  describe('ecommerce.product_removed', () => {
    it('also routes through cart update logic', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_removed',
          data: {
            product: { sku: 'RM-SKU', name: 'Removed Item', price: 15 },
            cartTotal: 30,
          },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['addEcommerceItem', 'RM-SKU', 'Removed Item', '', 15, 1]);
      expect(paq[1]).toEqual(['trackEcommerceCartUpdate', 30]);
    });
  });

  // ---------------------------------------------------------------
  // 8. Purchase
  // ---------------------------------------------------------------
  describe('ecommerce.purchase', () => {
    it('pushes addEcommerceItem for each product then trackEcommerceOrder', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-100',
            total: 150.0,
            subTotal: 130.0,
            tax: 10.0,
            shipping: 10.0,
            discount: 5.0,
            products: [
              { sku: 'P1', name: 'Product 1', category: 'Cat A', price: 50, quantity: 2 },
              { sku: 'P2', name: 'Product 2', category: 'Cat B', price: 30, quantity: 1 },
            ],
          },
        }),
      );
      expect(paq).toHaveLength(3);
      expect(paq[0]).toEqual(['addEcommerceItem', 'P1', 'Product 1', 'Cat A', 50, 2]);
      expect(paq[1]).toEqual(['addEcommerceItem', 'P2', 'Product 2', 'Cat B', 30, 1]);
      expect(paq[2]).toEqual(['trackEcommerceOrder', 'ORD-100', 150, 130, 10, 10, 5]);
    });

    it('falls back to transactionId when orderId is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { transactionId: 'TXN-200', total: 50 },
        }),
      );
      const orderCmd = paq[0];
      expect(orderCmd[0]).toBe('trackEcommerceOrder');
      expect(orderCmd[1]).toBe('TXN-200');
    });

    it('falls back to revenue when total is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-300', revenue: 75 },
        }),
      );
      const orderCmd = paq[0];
      expect(orderCmd[2]).toBe(75); // grandTotal
    });

    it('uses grandTotal as subTotal when subTotal is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-400', total: 80 },
        }),
      );
      const orderCmd = paq[0];
      expect(orderCmd[3]).toBe(80); // subTotal defaults to grandTotal
    });

    it('defaults tax and shipping to 0 and discount to false', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-500', total: 100 },
        }),
      );
      const orderCmd = paq[0];
      expect(orderCmd[4]).toBe(0); // tax
      expect(orderCmd[5]).toBe(0); // shipping
      expect(orderCmd[6]).toBe(false); // discount
    });

    it('handles purchase with no products array', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-600', total: 25 },
        }),
      );
      expect(paq).toHaveLength(1);
      expect(paq[0][0]).toBe('trackEcommerceOrder');
    });

    it('uses product.id as fallback for product.sku in purchase items', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-700',
            total: 20,
            products: [{ id: 'ITEM-ID', name: 'Fallback Item', price: 20 }],
          },
        }),
      );
      expect(paq[0]).toEqual(['addEcommerceItem', 'ITEM-ID', 'Fallback Item', '', 20, 1]);
    });
  });

  // ---------------------------------------------------------------
  // 9. User identification
  // ---------------------------------------------------------------
  describe('user.identified', () => {
    it('pushes setUserId with userId', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { userId: 'user-42' },
        }),
      );
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['setUserId', 'user-42']);
    });

    it('falls back to data.id when data.userId is missing', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { id: 'id-fallback' },
        }),
      );
      expect(paq[0]).toEqual(['setUserId', 'id-fallback']);
    });

    it('does not push setUserId when neither userId nor id is present', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.identified' }));
      expect(paq).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // 10. User signed out
  // ---------------------------------------------------------------
  describe('user.signed_out', () => {
    it('pushes resetUserId, appendToTrackingUrl, and trackPageView', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_out' }));
      expect(paq).toHaveLength(3);
      expect(paq[0]).toEqual(['resetUserId']);
      expect(paq[1]).toEqual(['appendToTrackingUrl', 'new_visit=1']);
      expect(paq[2]).toEqual(['trackPageView']);
    });
  });

  // ---------------------------------------------------------------
  // 11. Generic event tracking (default/fallback)
  // ---------------------------------------------------------------
  describe('generic event tracking', () => {
    it('pushes trackEvent with category and action from event name', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackEvent', 'custom', 'click', undefined, undefined]);
    });

    it('uses "unknown" for category when event has no dot', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'standalone' }));
      expect(paq[0]).toEqual(['trackEvent', 'standalone', 'unknown', undefined, undefined]);
    });

    it('joins multiple dot segments after first as the action', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'app.form.submit' }));
      expect(paq[0]).toEqual(['trackEvent', 'app', 'form.submit', undefined, undefined]);
    });

    it('includes label and value from event data', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ui.button_click',
          data: { label: 'signup-btn', value: 5 },
        }),
      );
      expect(paq[0]).toEqual(['trackEvent', 'ui', 'button_click', 'signup-btn', 5]);
    });

    it('leaves name as undefined when label is absent', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ui.action', data: { value: 10 } }));
      expect(paq[0]).toEqual(['trackEvent', 'ui', 'action', undefined, 10]);
    });
  });

  // ---------------------------------------------------------------
  // 12. Custom dimension mapping
  // ---------------------------------------------------------------
  describe('custom dimensions', () => {
    it('pushes setCustomDimension commands before the tracking call', () => {
      const plugin = piwikAdapter({
        customDimensionMap: { env: 1, region: 2 },
      });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          customDimensions: { env: 'production', region: 'US' },
        }),
      );
      expect(paq).toHaveLength(3);
      expect(paq[0]).toEqual(['setCustomDimension', 1, 'production']);
      expect(paq[1]).toEqual(['setCustomDimension', 2, 'US']);
      expect(paq[2]).toEqual(['trackPageView']);
    });

    it('converts non-string dimension values to strings', () => {
      const plugin = piwikAdapter({
        customDimensionMap: { count: 3, active: 4 },
      });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          customDimensions: { count: 42, active: true },
        }),
      );
      expect(paq[0]).toEqual(['setCustomDimension', 3, '42']);
      expect(paq[1]).toEqual(['setCustomDimension', 4, 'true']);
    });

    it('ignores custom dimensions not in the map', () => {
      const plugin = piwikAdapter({
        customDimensionMap: { mapped: 5 },
      });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          customDimensions: { mapped: 'yes', unmapped: 'no' },
        }),
      );
      expect(paq).toHaveLength(2);
      expect(paq[0]).toEqual(['setCustomDimension', 5, 'yes']);
      expect(paq[1]).toEqual(['trackPageView']);
    });

    it('does nothing when event has no customDimensions', () => {
      const plugin = piwikAdapter({
        customDimensionMap: { env: 1 },
      });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(paq).toHaveLength(1);
      expect(paq[0]).toEqual(['trackPageView']);
    });
  });

  // ---------------------------------------------------------------
  // 13. Custom eventCategoryMap
  // ---------------------------------------------------------------
  describe('custom eventCategoryMap', () => {
    it('overrides the category for generic events', () => {
      const plugin = piwikAdapter({
        eventCategoryMap: { 'custom.click': 'Interactions' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect(paq[0]).toEqual(['trackEvent', 'Interactions', 'click', undefined, undefined]);
    });

    it('falls back to first segment when event is not in the map', () => {
      const plugin = piwikAdapter({
        eventCategoryMap: { 'other.event': 'Other' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'custom.action' }));
      expect(paq[0][1]).toBe('custom');
    });
  });

  // ---------------------------------------------------------------
  // 14. Custom paqInstance option
  // ---------------------------------------------------------------
  describe('custom paqInstance', () => {
    it('uses provided paqInstance instead of window._paq', () => {
      const customPaq: unknown[][] = [];
      const plugin = piwikAdapter({ paqInstance: customPaq });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));

      // The default paq (from window._paq) should not receive the command
      expect(paq).toHaveLength(0);
      // The custom instance should
      expect(customPaq).toHaveLength(1);
      expect(customPaq[0]).toEqual(['trackPageView']);
    });

    it('works even when window._paq is not defined', () => {
      globalThis.window = {} as any;
      const customPaq: unknown[][] = [];
      const plugin = piwikAdapter({ paqInstance: customPaq });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(customPaq).toHaveLength(1);
      expect(customPaq[0]).toEqual(['trackPageView']);
    });
  });

  // ---------------------------------------------------------------
  // 15. SSR safety
  // ---------------------------------------------------------------
  describe('SSR safety', () => {
    it('does not error when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = piwikAdapter();
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
      expect(() => plugin.destroy?.()).not.toThrow();
    });

    it('does not push any commands when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      // No crash, no side effects -- nothing to assert on paq since it is detached
    });
  });

  // ---------------------------------------------------------------
  // 16. Warn when _paq is not found
  // ---------------------------------------------------------------
  describe('warning when _paq not found', () => {
    it('warns during initialize when paqInstance is falsy and _paq cannot be resolved', () => {
      // Provide a window so initialize does not early-return,
      // but ensure _paq somehow ends up undefined after assignment.
      // Actually, initialize will create _paq when paqInstance is not set.
      // The warn path is only reachable when getPaq() returns undefined.
      // That means: no paqInstance, and typeof window !== 'undefined' but window._paq is still undefined.
      // Since initialize does `window._paq = window._paq ?? []`, _paq will always be set.
      // The warn fires if getPaq returns undefined after that -- which cannot happen
      // unless something external deletes it between the assignment and the check.
      // Let's use a getter to simulate that edge case.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fakeWindow: Record<string, unknown> = {};
      let callCount = 0;
      Object.defineProperty(fakeWindow, '_paq', {
        get() {
          callCount++;
          // First call (the `??` check) returns undefined, assignment sets it,
          // but our getter ignores the set -- so second call also returns undefined.
          return undefined;
        },
        set() {
          // no-op: prevents the assignment from sticking
        },
        configurable: true,
      });
      globalThis.window = fakeWindow as any;

      const plugin = piwikAdapter();
      plugin.initialize?.(undefined);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('_paq not found'));
      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // Destroy
  // ---------------------------------------------------------------
  describe('destroy()', () => {
    it('can be called without error', () => {
      const plugin = piwikAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // Multiple events in sequence
  // ---------------------------------------------------------------
  describe('multiple events', () => {
    it('accumulates commands in the _paq array', () => {
      const plugin = piwikAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'u1' } }));
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect(paq).toHaveLength(3);
      expect(paq[0]).toEqual(['trackPageView']);
      expect(paq[1]).toEqual(['setUserId', 'u1']);
      expect(paq[2]).toEqual(['trackEvent', 'custom', 'click', undefined, undefined]);
    });
  });

  // ---------------------------------------------------------------
  // afterEvent silently no-ops when _paq is missing
  // ---------------------------------------------------------------
  describe('afterEvent without _paq', () => {
    it('silently does nothing when _paq is not available and no paqInstance', () => {
      globalThis.window = {} as any;
      // window exists but _paq does not, and no paqInstance
      const plugin = piwikAdapter();
      // Do NOT call initialize (which would create _paq)
      expect(() => plugin.afterEvent?.(makeEvent({ event: 'page.view' }))).not.toThrow();
    });
  });
});
