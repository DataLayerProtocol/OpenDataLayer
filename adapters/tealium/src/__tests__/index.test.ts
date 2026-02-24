/**
 * Tests for @opendatalayer/adapter-tealium
 */

declare const globalThis: { window?: Record<string, unknown> };

import { tealiumAdapter } from '../index.js';

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

let mockUtag: { view: ReturnType<typeof vi.fn>; link: ReturnType<typeof vi.fn> };

beforeEach(() => {
  mockUtag = { view: vi.fn(), link: vi.fn() };
  globalThis.window = { utag: mockUtag } as any;
});

afterEach(() => {
  globalThis.window = undefined;
});

describe('tealiumAdapter', () => {
  // ---------------------------------------------------------------------------
  // 1. Plugin structure
  // ---------------------------------------------------------------------------
  describe('plugin structure', () => {
    it('returns a plugin with name "tealium-adapter"', () => {
      const plugin = tealiumAdapter();
      expect(plugin.name).toBe('tealium-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const plugin = tealiumAdapter();
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });

    it('destroy can be called without error', () => {
      const plugin = tealiumAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Page view calls utag.view()
  // ---------------------------------------------------------------------------
  describe('page view routing', () => {
    it('calls utag.view() for page.view events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(mockUtag.view).toHaveBeenCalledTimes(1);
      expect(mockUtag.link).not.toHaveBeenCalled();
    });

    it('calls utag.view() for page.virtual_view events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      expect(mockUtag.view).toHaveBeenCalledTimes(1);
      expect(mockUtag.link).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Non-page events call utag.link()
  // ---------------------------------------------------------------------------
  describe('non-page event routing', () => {
    it('calls utag.link() for ecommerce events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      expect(mockUtag.link).toHaveBeenCalledTimes(1);
      expect(mockUtag.view).not.toHaveBeenCalled();
    });

    it('calls utag.link() for user events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_in' }));
      expect(mockUtag.link).toHaveBeenCalledTimes(1);
      expect(mockUtag.view).not.toHaveBeenCalled();
    });

    it('calls utag.link() for custom events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect(mockUtag.link).toHaveBeenCalledTimes(1);
      expect(mockUtag.view).not.toHaveBeenCalled();
    });

    it('calls utag.link() for search events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      expect(mockUtag.link).toHaveBeenCalledTimes(1);
      expect(mockUtag.view).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Event name mapping (defaults + custom)
  // ---------------------------------------------------------------------------
  describe('event name mapping', () => {
    it('maps page.view to page_view', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const data = mockUtag.view.mock.calls[0][0];
      expect(data.tealium_event).toBe('page_view');
    });

    it('maps page.virtual_view to virtual_page_view', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      const data = mockUtag.view.mock.calls[0][0];
      expect(data.tealium_event).toBe('virtual_page_view');
    });

    it('maps ecommerce.product_viewed to product_view', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('product_view');
    });

    it('maps ecommerce.product_added to cart_add', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('cart_add');
    });

    it('maps ecommerce.product_removed to cart_remove', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_removed' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('cart_remove');
    });

    it('maps ecommerce.purchase to purchase', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('purchase');
    });

    it('maps ecommerce.checkout_started to checkout', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.checkout_started' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('checkout');
    });

    it('maps user.signed_up to user_registration', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_up' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('user_registration');
    });

    it('maps user.signed_in to user_login', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_in' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('user_login');
    });

    it('maps search.performed to search', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('search');
    });

    it('allows custom eventNameMap to override defaults', () => {
      const plugin = tealiumAdapter({
        eventNameMap: { 'page.view': 'my_page_view' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const data = mockUtag.view.mock.calls[0][0];
      expect(data.tealium_event).toBe('my_page_view');
    });

    it('custom eventNameMap preserves non-overridden defaults', () => {
      const plugin = tealiumAdapter({
        eventNameMap: { 'page.view': 'my_page_view' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('purchase');
    });

    it('custom eventNameMap can add new mappings', () => {
      const plugin = tealiumAdapter({
        eventNameMap: { 'video.play': 'media_play' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'video.play' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('media_play');
    });
  });

  // ---------------------------------------------------------------------------
  // 18. Unmapped events use dot-to-underscore fallback
  // ---------------------------------------------------------------------------
  describe('unmapped event fallback', () => {
    it('replaces dots with underscores for unmapped events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.my_event.fired' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('custom_my_event_fired');
    });

    it('handles single-segment event names', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'click' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBe('click');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. All values are strings in output
  // ---------------------------------------------------------------------------
  describe('all values are strings', () => {
    it('converts numeric data values to strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { count: 42, price: 9.99 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.count).toBe('42');
      expect(data.price).toBe('9.99');
      expect(typeof data.count).toBe('string');
      expect(typeof data.price).toBe('string');
    });

    it('converts boolean data values to strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { active: true, disabled: false },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.active).toBe('true');
      expect(data.disabled).toBe('false');
    });

    it('converts array values to strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { tags: ['a', 'b', 'c'] },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tags).toBe('a,b,c');
      expect(typeof data.tags).toBe('string');
    });

    it('metadata fields are strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent());
      const data = mockUtag.link.mock.calls[0][0];
      expect(typeof data.tealium_event).toBe('string');
      expect(typeof data.odl_event_id).toBe('string');
      expect(typeof data.odl_timestamp).toBe('string');
    });

    it('ecommerce product fields are strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            products: [{ id: 'SKU1', price: 9.99, quantity: 2 }],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(typeof data.product_id).toBe('string');
      expect(typeof data.product_price).toBe('string');
      expect(typeof data.product_quantity).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Nested object flattening
  // ---------------------------------------------------------------------------
  describe('nested object flattening', () => {
    it('flattens single-level nested objects with underscore delimiter', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { page: { title: 'Home', url: '/home' } },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.page_title).toBe('Home');
      expect(data.page_url).toBe('/home');
    });

    it('flattens deeply nested objects', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { user: { address: { city: 'Portland', state: 'OR' } } },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.user_address_city).toBe('Portland');
      expect(data.user_address_state).toBe('OR');
    });

    it('skips null values during flattening', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { name: 'test', empty: null },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.name).toBe('test');
      expect('empty' in data).toBe(false);
    });

    it('skips undefined values during flattening', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { name: 'test', missing: undefined },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.name).toBe('test');
      expect('missing' in data).toBe(false);
    });

    it('handles mixed nested and flat data', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: {
            simpleKey: 'value',
            nested: { deep: 'found' },
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.simpleKey).toBe('value');
      expect(data.nested_deep).toBe('found');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Ecommerce product array mapping (comma-joined)
  // ---------------------------------------------------------------------------
  describe('ecommerce product array mapping', () => {
    it('maps multiple products to comma-joined parallel arrays', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            products: [
              {
                id: 'SKU1',
                name: 'Widget',
                price: 9.99,
                quantity: 2,
                brand: 'Acme',
                category: 'Tools',
              },
              {
                id: 'SKU2',
                name: 'Gadget',
                price: 19.99,
                quantity: 1,
                brand: 'BrandX',
                category: 'Electronics',
              },
            ],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_id).toBe('SKU1,SKU2');
      expect(data.product_name).toBe('Widget,Gadget');
      expect(data.product_price).toBe('9.99,19.99');
      expect(data.product_quantity).toBe('2,1');
      expect(data.product_brand).toBe('Acme,BrandX');
      expect(data.product_category).toBe('Tools,Electronics');
    });

    it('defaults missing product quantity to "1"', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: {
            products: [{ id: 'SKU1', name: 'Thing' }],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_quantity).toBe('1');
    });

    it('uses empty string for missing optional product fields', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            products: [{ id: 'SKU-MINIMAL' }],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_id).toBe('SKU-MINIMAL');
      expect(data.product_name).toBe('');
      expect(data.product_brand).toBe('');
      expect(data.product_category).toBe('');
    });

    it('maps three or more products correctly', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            products: [
              { id: 'A', name: 'Alpha', price: 1, quantity: 10, brand: 'B1', category: 'C1' },
              { id: 'B', name: 'Beta', price: 2, quantity: 20, brand: 'B2', category: 'C2' },
              { id: 'C', name: 'Gamma', price: 3, quantity: 30, brand: 'B3', category: 'C3' },
            ],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_id).toBe('A,B,C');
      expect(data.product_name).toBe('Alpha,Beta,Gamma');
      expect(data.product_price).toBe('1,2,3');
      expect(data.product_quantity).toBe('10,20,30');
      expect(data.product_brand).toBe('B1,B2,B3');
      expect(data.product_category).toBe('C1,C2,C3');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Single product mapping
  // ---------------------------------------------------------------------------
  describe('single product mapping', () => {
    it('maps a single product object to parallel arrays with one entry', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            product: {
              id: 'P-SINGLE',
              name: 'Solo Product',
              price: 29.99,
              quantity: 1,
              brand: 'SoloBrand',
              category: 'Singles',
            },
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_id).toBe('P-SINGLE');
      expect(data.product_name).toBe('Solo Product');
      expect(data.product_price).toBe('29.99');
      expect(data.product_quantity).toBe('1');
      expect(data.product_brand).toBe('SoloBrand');
      expect(data.product_category).toBe('Singles');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Order data mapping
  // ---------------------------------------------------------------------------
  describe('order data mapping', () => {
    it('maps orderId to order_id', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-123' },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_id).toBe('ORD-123');
    });

    it('maps total to order_total', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { total: 99.99 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_total).toBe('99.99');
    });

    it('maps revenue to order_total (revenue takes precedence over total)', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { total: 100.0, revenue: 85.0 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_total).toBe('85');
    });

    it('maps currency to order_currency', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { currency: 'USD' },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_currency).toBe('USD');
    });

    it('maps tax to order_tax', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { tax: 8.5 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_tax).toBe('8.5');
    });

    it('maps shipping to order_shipping', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { shipping: 5.99 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_shipping).toBe('5.99');
    });

    it('maps all order fields together', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-999',
            total: 150.0,
            currency: 'EUR',
            tax: 12.0,
            shipping: 7.5,
            products: [
              { id: 'P1', name: 'Item', price: 130.5, quantity: 1, brand: 'X', category: 'Y' },
            ],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.order_id).toBe('ORD-999');
      expect(data.order_total).toBe('150');
      expect(data.order_currency).toBe('EUR');
      expect(data.order_tax).toBe('12');
      expect(data.order_shipping).toBe('7.5');
      expect(data.product_id).toBe('P1');
    });
  });

  // ---------------------------------------------------------------------------
  // 10. ODL metadata included
  // ---------------------------------------------------------------------------
  describe('ODL metadata', () => {
    it('always includes tealium_event, odl_event_id, and odl_timestamp', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent());
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBeDefined();
      expect(data.odl_event_id).toBe('test-id-123');
      expect(data.odl_timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('includes correct metadata from the event', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ id: 'abc-456', timestamp: '2025-06-01T12:30:00.000Z' }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.odl_event_id).toBe('abc-456');
      expect(data.odl_timestamp).toBe('2025-06-01T12:30:00.000Z');
    });

    it('tealium_event reflects the mapped event name', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const data = mockUtag.view.mock.calls[0][0];
      expect(data.tealium_event).toBe('page_view');
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Custom dimensions included
  // ---------------------------------------------------------------------------
  describe('customDimensions', () => {
    it('includes customDimensions as string values', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          customDimensions: { dimension1: 'value1', dimension2: 42, dimension3: true },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.dimension1).toBe('value1');
      expect(data.dimension2).toBe('42');
      expect(data.dimension3).toBe('true');
    });

    it('customDimensions are converted to strings', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          customDimensions: { numericKey: 100 },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(typeof data.numericKey).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // 12. keyPrefix applied to all keys
  // ---------------------------------------------------------------------------
  describe('keyPrefix option', () => {
    it('prefixes all keys with the specified prefix', () => {
      const plugin = tealiumAdapter({ keyPrefix: 'odl' });
      plugin.afterEvent?.(
        makeEvent({
          data: { pageName: 'Home' },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.odl_pageName).toBe('Home');
      expect(data.odl_tealium_event).toBeDefined();
      expect(data.odl_odl_event_id).toBe('test-id-123');
      expect(data.odl_odl_timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('prefixes ecommerce product keys', () => {
      const plugin = tealiumAdapter({ keyPrefix: 'myapp' });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            products: [
              { id: 'SKU1', name: 'Widget', price: 10, quantity: 1, brand: 'A', category: 'B' },
            ],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.myapp_product_id).toBe('SKU1');
      expect(data.myapp_product_name).toBe('Widget');
    });

    it('does not apply prefix when keyPrefix is not set', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          data: { pageName: 'Home' },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.pageName).toBe('Home');
      expect(data.tealium_event).toBeDefined();
    });

    it('does not apply prefix when keyPrefix is empty string', () => {
      const plugin = tealiumAdapter({ keyPrefix: '' });
      plugin.afterEvent?.(
        makeEvent({
          data: { pageName: 'Home' },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.pageName).toBe('Home');
      expect(data.tealium_event).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 13. autoPopulateUDO sets window.utag_data on page events
  // ---------------------------------------------------------------------------
  describe('autoPopulateUDO (default true)', () => {
    it('sets window.utag_data on page.view events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { pageName: 'Home' } }));
      const utagData = (globalThis.window as any).utag_data;
      expect(utagData).toBeDefined();
      expect(utagData.pageName).toBe('Home');
      expect(utagData.tealium_event).toBe('page_view');
    });

    it('sets window.utag_data on page.virtual_view events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view', data: { pageName: 'Virtual' } }));
      const utagData = (globalThis.window as any).utag_data;
      expect(utagData).toBeDefined();
      expect(utagData.pageName).toBe('Virtual');
    });

    it('does not set window.utag_data on non-page events', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect((globalThis.window as any).utag_data).toBeUndefined();
    });

    it('utag_data is a copy, not the same reference as the data passed to utag.view', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { pageName: 'Home' } }));
      const utagData = (globalThis.window as any).utag_data;
      const viewData = mockUtag.view.mock.calls[0][0];
      expect(utagData).toEqual(viewData);
      expect(utagData).not.toBe(viewData);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. autoPopulateUDO=false does not set window.utag_data
  // ---------------------------------------------------------------------------
  describe('autoPopulateUDO=false', () => {
    it('does not set window.utag_data when autoPopulateUDO is false', () => {
      const plugin = tealiumAdapter({ autoPopulateUDO: false });
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { pageName: 'Home' } }));
      expect((globalThis.window as any).utag_data).toBeUndefined();
    });

    it('still calls utag.view() when autoPopulateUDO is false', () => {
      const plugin = tealiumAdapter({ autoPopulateUDO: false });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(mockUtag.view).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 15. Custom utagInstance option
  // ---------------------------------------------------------------------------
  describe('custom utagInstance', () => {
    it('uses the provided utagInstance instead of window.utag', () => {
      const customUtag = { view: vi.fn(), link: vi.fn() };
      const plugin = tealiumAdapter({ utagInstance: customUtag });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(customUtag.view).toHaveBeenCalledTimes(1);
      expect(mockUtag.view).not.toHaveBeenCalled();
    });

    it('custom utagInstance receives link calls for non-page events', () => {
      const customUtag = { view: vi.fn(), link: vi.fn() };
      const plugin = tealiumAdapter({ utagInstance: customUtag });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      expect(customUtag.link).toHaveBeenCalledTimes(1);
      expect(mockUtag.link).not.toHaveBeenCalled();
    });

    it('works even when window.utag is not available', () => {
      globalThis.window = {} as any; // no utag on window
      const customUtag = { view: vi.fn(), link: vi.fn() };
      const plugin = tealiumAdapter({ utagInstance: customUtag });
      plugin.afterEvent?.(makeEvent());
      expect(customUtag.link).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 16. SSR safety
  // ---------------------------------------------------------------------------
  describe('SSR safety', () => {
    it('does not error when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = tealiumAdapter();
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
      expect(() => plugin.destroy?.()).not.toThrow();
    });

    it('does not call utag methods when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent());
      // No utag should have been called since window is undefined
      expect(mockUtag.view).not.toHaveBeenCalled();
      expect(mockUtag.link).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 17. Warns when utag not found
  // ---------------------------------------------------------------------------
  describe('initialize warnings', () => {
    it('warns when utag is not found on window', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.window = {} as any; // window exists but no utag
      const plugin = tealiumAdapter();
      plugin.initialize?.(undefined);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('utag not found');
      warnSpy.mockRestore();
    });

    it('does not warn when utag is present', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const plugin = tealiumAdapter();
      plugin.initialize?.(undefined);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('does not warn in SSR (no window)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.window = undefined;
      const plugin = tealiumAdapter();
      plugin.initialize?.(undefined);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('does not warn when custom utagInstance is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.window = {} as any; // no utag
      const customUtag = { view: vi.fn(), link: vi.fn() };
      const plugin = tealiumAdapter({ utagInstance: customUtag });
      plugin.initialize?.(undefined);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases and integration
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles event with no data', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent());
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBeDefined();
      expect(data.odl_event_id).toBe('test-id-123');
    });

    it('handles event with empty data object', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ data: {} }));
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.tealium_event).toBeDefined();
      expect(data.odl_event_id).toBe('test-id-123');
    });

    it('does not call utag when utag is missing and no utagInstance provided', () => {
      globalThis.window = {} as any;
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent());
      expect(mockUtag.view).not.toHaveBeenCalled();
      expect(mockUtag.link).not.toHaveBeenCalled();
    });

    it('handles multiple sequential events correctly', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase', data: { orderId: '1' } }));
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      expect(mockUtag.view).toHaveBeenCalledTimes(1);
      expect(mockUtag.link).toHaveBeenCalledTimes(2);
    });

    it('ecommerce event does not duplicate order fields from flat remaining data', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-DUP',
            total: 50,
            currency: 'GBP',
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      // order_id comes from mapOrderData; orderId may also appear from flattenToStrings
      // but the mapped order_id should have the correct value
      expect(data.order_id).toBe('ORD-DUP');
      expect(data.order_total).toBe('50');
      expect(data.order_currency).toBe('GBP');
    });

    it('ecommerce event with both products array and additional data fields', () => {
      const plugin = tealiumAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-COMBO',
            total: 200,
            currency: 'USD',
            couponCode: 'SAVE20',
            products: [
              { id: 'A', name: 'Alpha', price: 100, quantity: 1, brand: 'B', category: 'C' },
              { id: 'B', name: 'Beta', price: 100, quantity: 1, brand: 'B', category: 'C' },
            ],
          },
        }),
      );
      const data = mockUtag.link.mock.calls[0][0];
      expect(data.product_id).toBe('A,B');
      expect(data.order_id).toBe('ORD-COMBO');
      expect(data.order_total).toBe('200');
      expect(data.couponCode).toBe('SAVE20');
    });
  });
});
