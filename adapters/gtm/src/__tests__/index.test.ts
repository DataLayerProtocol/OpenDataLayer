/**
 * Tests for @opendatalayer/adapter-gtm
 */

declare const globalThis: { window?: Record<string, unknown> };

import { gtmAdapter } from '../index.js';

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

beforeEach(() => {
  globalThis.window = { dataLayer: [] } as any;
});

afterEach(() => {
  globalThis.window = undefined;
});

describe('gtmAdapter', () => {
  describe('plugin structure', () => {
    it('returns a plugin with name "gtm-adapter"', () => {
      const plugin = gtmAdapter();
      expect(plugin.name).toBe('gtm-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const plugin = gtmAdapter();
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  describe('initialize()', () => {
    it('creates window.dataLayer if it does not exist', () => {
      globalThis.window = {} as any;
      const plugin = gtmAdapter();
      plugin.initialize?.(undefined);
      expect(Array.isArray((globalThis.window as any).dataLayer)).toBe(true);
    });

    it('preserves existing window.dataLayer', () => {
      const existing = [{ event: 'existing' }];
      globalThis.window = { dataLayer: existing } as any;
      const plugin = gtmAdapter();
      plugin.initialize?.(undefined);
      expect((globalThis.window as any).dataLayer).toBe(existing);
      expect((globalThis.window as any).dataLayer).toHaveLength(1);
    });
  });

  describe('afterEvent()', () => {
    it('pushes an event to window.dataLayer', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent());
      const dl = (globalThis.window as any).dataLayer;
      expect(dl).toHaveLength(1);
      expect(dl[0].event).toBeDefined();
    });
  });

  describe('event name mapping', () => {
    it('maps page.view to page_view', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('page_view');
    });

    it('maps ecommerce.purchase to purchase', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('purchase');
    });

    it('maps ecommerce.product_viewed to view_item', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('view_item');
    });

    it('maps ecommerce.product_added to add_to_cart', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('add_to_cart');
    });

    it('maps ecommerce.checkout_started to begin_checkout', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.checkout_started' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('begin_checkout');
    });

    it('maps user.signed_up to sign_up', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_up' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('sign_up');
    });

    it('maps user.signed_in to login', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_in' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('login');
    });

    it('maps search.performed to search', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('search');
    });

    it('uses dot-to-underscore fallback for unmapped events', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.my_event.fired' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('custom_my_event_fired');
    });

    it('allows custom eventNameMap to override defaults', () => {
      const plugin = gtmAdapter({
        eventNameMap: { 'page.view': 'my_custom_page_view' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('my_custom_page_view');
    });

    it('custom eventNameMap preserves non-overridden defaults', () => {
      const plugin = gtmAdapter({
        eventNameMap: { 'page.view': 'my_custom_page_view' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].event).toBe('purchase');
    });
  });

  describe('ecommerce event mapping', () => {
    it('wraps ecommerce data in GA4 ecommerce format', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-123',
            total: 99.99,
            currency: 'USD',
            products: [
              {
                id: 'P1',
                name: 'Widget',
                brand: 'Acme',
                category: 'Widgets',
                price: 49.99,
                quantity: 2,
              },
            ],
          },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce).toBeDefined();
      expect(dl[0].ecommerce.transaction_id).toBe('ORD-123');
      expect(dl[0].ecommerce.value).toBe(99.99);
      expect(dl[0].ecommerce.currency).toBe('USD');
    });

    it('maps products to items array with GA4 field names', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            products: [
              {
                id: 'SKU-1',
                name: 'Blue Shirt',
                brand: 'FashionCo',
                category: 'Apparel',
                variant: 'Large',
                price: 29.99,
                quantity: 1,
                coupon: 'SAVE10',
                discount: 3.0,
                position: 2,
              },
            ],
          },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      const item = dl[0].ecommerce.items[0];
      expect(item.item_id).toBe('SKU-1');
      expect(item.item_name).toBe('Blue Shirt');
      expect(item.item_brand).toBe('FashionCo');
      expect(item.item_category).toBe('Apparel');
      expect(item.item_variant).toBe('Large');
      expect(item.price).toBe(29.99);
      expect(item.quantity).toBe(1);
      expect(item.coupon).toBe('SAVE10');
      expect(item.discount).toBe(3.0);
      expect(item.index).toBe(2);
    });

    it('maps a single product object to items array', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            product: { id: 'P-SINGLE', name: 'Solo Product' },
          },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.items).toHaveLength(1);
      expect(dl[0].ecommerce.items[0].item_id).toBe('P-SINGLE');
      expect(dl[0].ecommerce.items[0].item_name).toBe('Solo Product');
    });

    it('maps orderId to transaction_id', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'TXN-456' },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.transaction_id).toBe('TXN-456');
    });

    it('maps total to value', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { total: 150.0 },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.value).toBe(150.0);
    });

    it('maps revenue to value (revenue takes precedence if both present)', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { total: 100.0, revenue: 85.0 },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.value).toBe(85.0);
    });

    it('defaults product quantity to 1 when missing', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_added',
          data: {
            products: [{ id: 'P1', name: 'Thing' }],
          },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.items[0].quantity).toBe(1);
    });

    it('maps tax and shipping fields', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { tax: 8.5, shipping: 5.99 },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.tax).toBe(8.5);
      expect(dl[0].ecommerce.shipping).toBe(5.99);
    });

    it('maps coupon at the order level', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { coupon: 'SUMMER20' },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.coupon).toBe('SUMMER20');
    });

    it('maps list fields to GA4 item_list_id and item_list_name', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_list_viewed',
          data: { listId: 'cat-123', listName: 'Summer Collection' },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].ecommerce.item_list_id).toBe('cat-123');
      expect(dl[0].ecommerce.item_list_name).toBe('Summer Collection');
    });

    it('maps promotion data', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.promotion_viewed',
          data: {
            promotion: {
              id: 'PROMO-1',
              name: 'Summer Sale',
              creative: 'banner_v2',
              position: 'header',
            },
          },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      const promoItem = dl[0].ecommerce.items[0];
      expect(promoItem.promotion_id).toBe('PROMO-1');
      expect(promoItem.promotion_name).toBe('Summer Sale');
      expect(promoItem.creative_name).toBe('banner_v2');
      expect(promoItem.creative_slot).toBe('header');
    });
  });

  describe('non-ecommerce data handling', () => {
    it('flattens data by default (flattenData: true)', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { page: { title: 'Home', url: '/home' } },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].page_title).toBe('Home');
      expect(dl[0].page_url).toBe('/home');
      expect(dl[0].data).toBeUndefined();
    });

    it('nests data under "data" key when flattenData is false', () => {
      const plugin = gtmAdapter({ flattenData: false });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { page: { title: 'Home' } },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].data).toEqual({ page: { title: 'Home' } });
      expect(dl[0].page_title).toBeUndefined();
    });
  });

  describe('customDimensions', () => {
    it('includes customDimensions in the push', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          customDimensions: { dimension1: 'value1', dimension2: 42, dimension3: true },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].dimension1).toBe('value1');
      expect(dl[0].dimension2).toBe(42);
      expect(dl[0].dimension3).toBe(true);
    });
  });

  describe('includeContext option', () => {
    it('does not include context by default (includeContext: false)', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1' }, page: { path: '/home' } },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].context).toBeUndefined();
    });

    it('includes context when includeContext is true', () => {
      const plugin = gtmAdapter({ includeContext: true });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1' }, page: { path: '/home' } },
        }),
      );
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].context).toEqual({ user: { id: 'u1' }, page: { path: '/home' } });
    });

    it('does not add context key when event has no context even if includeContext is true', () => {
      const plugin = gtmAdapter({ includeContext: true });
      plugin.afterEvent?.(makeEvent());
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].context).toBeUndefined();
    });
  });

  describe('ODL metadata', () => {
    it('always includes odl_event_id and odl_timestamp', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent());
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].odl_event_id).toBe('test-id-123');
      expect(dl[0].odl_timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('includes correct metadata from the event', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ id: 'abc-456', timestamp: '2025-06-01T12:30:00.000Z' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl[0].odl_event_id).toBe('abc-456');
      expect(dl[0].odl_timestamp).toBe('2025-06-01T12:30:00.000Z');
    });
  });

  describe('SSR safety', () => {
    it('does not error when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = gtmAdapter();
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });

  describe('custom dataLayerName', () => {
    it('pushes to custom-named dataLayer variable', () => {
      globalThis.window = { myLayer: [] } as any;
      const plugin = gtmAdapter({ dataLayerName: 'myLayer' });
      plugin.initialize?.(undefined);
      plugin.afterEvent?.(makeEvent());
      const dl = (globalThis.window as any).myLayer;
      expect(dl).toHaveLength(1);
      expect(dl[0].event).toBe('test_event');
    });

    it('creates custom-named dataLayer if missing', () => {
      globalThis.window = {} as any;
      const plugin = gtmAdapter({ dataLayerName: 'customDL' });
      plugin.initialize?.(undefined);
      expect(Array.isArray((globalThis.window as any).customDL)).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('can be called without error', () => {
      const plugin = gtmAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });

  describe('multiple events', () => {
    it('accumulates events in the dataLayer', () => {
      const plugin = gtmAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase', data: { orderId: '1' } }));
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      const dl = (globalThis.window as any).dataLayer;
      expect(dl).toHaveLength(3);
      expect(dl[0].event).toBe('page_view');
      expect(dl[1].event).toBe('purchase');
      expect(dl[2].event).toBe('custom_click');
    });
  });
});
