/**
 * Tests for @opendatalayer/adapter-segment
 */

import { segmentAdapter } from '../index.js';

function createMockAnalytics() {
  return {
    page: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    group: vi.fn(),
    reset: vi.fn(),
  };
}

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

describe('segmentAdapter', () => {
  describe('plugin structure', () => {
    it('returns a plugin with name "segment-adapter"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      expect(plugin.name).toBe('segment-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  describe('page events', () => {
    it('calls analytics.page() for page events', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { title: 'Home', url: '/home' } }));
      expect(analytics.page).toHaveBeenCalledTimes(1);
      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('calls analytics.page() for page.virtual_view', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      expect(analytics.page).toHaveBeenCalledTimes(1);
      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('passes page category and name to analytics.page()', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          data: { category: 'Blog', name: 'Post Detail', url: '/blog/123' },
        }),
      );
      expect(analytics.page).toHaveBeenCalledWith(
        'Blog',
        'Post Detail',
        expect.objectContaining({ category: 'Blog', name: 'Post Detail', url: '/blog/123' }),
      );
    });

    it('uses title as page name when name is not present', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          data: { title: 'Welcome Page' },
        }),
      );
      expect(analytics.page).toHaveBeenCalledWith(undefined, 'Welcome Page', expect.any(Object));
    });
  });

  describe('track events', () => {
    it('calls analytics.track() for non-page events', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'interaction.share', data: { network: 'twitter' } }));
      expect(analytics.track).toHaveBeenCalledTimes(1);
      expect(analytics.page).not.toHaveBeenCalled();
    });
  });

  describe('event name mapping', () => {
    it('maps ecommerce.purchase to "Order Completed"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Order Completed', expect.any(Object));
    });

    it('maps ecommerce.product_viewed to "Product Viewed"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Product Viewed', expect.any(Object));
    });

    it('maps ecommerce.product_added to "Product Added"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Product Added', expect.any(Object));
    });

    it('maps ecommerce.checkout_started to "Checkout Started"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.checkout_started', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Checkout Started', expect.any(Object));
    });

    it('maps user.signed_up to "Signed Up"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_up' }));
      expect(analytics.track).toHaveBeenCalledWith('Signed Up', expect.any(Object));
    });

    it('maps search.performed to "Products Searched"', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      expect(analytics.track).toHaveBeenCalledWith('Products Searched', expect.any(Object));
    });

    it('title-cases unmapped events using dot-to-space (form.submitted -> "Form Submitted")', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'form.submitted' }));
      expect(analytics.track).toHaveBeenCalledWith('Form Submitted', expect.any(Object));
    });

    it('title-cases multi-segment unmapped events (custom.deep.event -> "Custom Deep Event")', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'custom.deep.event' }));
      expect(analytics.track).toHaveBeenCalledWith('Custom Deep Event', expect.any(Object));
    });

    it('allows custom eventNameMap to override defaults', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({
        analyticsInstance: analytics,
        eventNameMap: { 'ecommerce.purchase': 'Custom Purchase Event' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Custom Purchase Event', expect.any(Object));
    });

    it('custom eventNameMap preserves non-overridden defaults', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({
        analyticsInstance: analytics,
        eventNameMap: { 'ecommerce.purchase': 'My Purchase' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed', data: {} }));
      expect(analytics.track).toHaveBeenCalledWith('Product Viewed', expect.any(Object));
    });
  });

  describe('ecommerce data mapping', () => {
    it('maps products array to Segment format with product_id', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-100',
            total: 150.0,
            currency: 'USD',
            products: [
              {
                id: 'P1',
                sku: 'SKU-1',
                name: 'Widget',
                brand: 'Acme',
                category: 'Widgets',
                variant: 'Blue',
                price: 50.0,
                quantity: 3,
                coupon: 'DISC10',
                position: 1,
                url: '/products/widget',
                imageUrl: '/images/widget.jpg',
              },
            ],
          },
        }),
      );
      const call = analytics.track.mock.calls[0]!;
      const properties = call[1];
      expect(properties.order_id).toBe('ORD-100');
      expect(properties.total).toBe(150.0);
      expect(properties.currency).toBe('USD');
      expect(properties.products).toHaveLength(1);
      const product = properties.products[0];
      expect(product.product_id).toBe('P1');
      expect(product.sku).toBe('SKU-1');
      expect(product.name).toBe('Widget');
      expect(product.brand).toBe('Acme');
      expect(product.category).toBe('Widgets');
      expect(product.variant).toBe('Blue');
      expect(product.price).toBe(50.0);
      expect(product.quantity).toBe(3);
      expect(product.coupon).toBe('DISC10');
      expect(product.position).toBe(1);
      expect(product.url).toBe('/products/widget');
      expect(product.image_url).toBe('/images/widget.jpg');
    });

    it('maps orderId to order_id', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'TXN-999' },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.order_id).toBe('TXN-999');
    });

    it('maps single product to flattened top-level properties', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_viewed',
          data: {
            product: { id: 'P1', name: 'Solo Widget', brand: 'Acme' },
          },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.product_id).toBe('P1');
      expect(properties.name).toBe('Solo Widget');
      expect(properties.brand).toBe('Acme');
    });

    it('defaults product quantity to 1 when missing', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', name: 'Thing' }] },
        }),
      );
      const product = analytics.track.mock.calls[0]?.[1].products[0];
      expect(product.quantity).toBe(1);
    });

    it('maps tax, shipping, discount, and coupon fields', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { tax: 8.5, shipping: 5.99, discount: 10.0, coupon: 'SAVE10' },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.tax).toBe(8.5);
      expect(properties.shipping).toBe(5.99);
      expect(properties.discount).toBe(10.0);
      expect(properties.coupon).toBe('SAVE10');
    });

    it('maps checkout step and payment method', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.checkout_step_completed',
          data: { step: 2, paymentMethod: 'credit_card', shippingMethod: 'express' },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.step).toBe(2);
      expect(properties.payment_method).toBe('credit_card');
      expect(properties.shipping_method).toBe('express');
    });

    it('maps promotion data', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.promotion_viewed',
          data: {
            promotion: { id: 'PROMO-1', name: 'Summer Sale', creative: 'banner', position: 'top' },
          },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.promotion_id).toBe('PROMO-1');
      expect(properties.name).toBe('Summer Sale');
      expect(properties.creative).toBe('banner');
      expect(properties.position).toBe('top');
    });

    it('maps search query', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'search.performed',
          data: { query: 'blue widgets' },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.query).toBe('blue widgets');
    });

    it('maps list fields: listId to list_id and listName to category', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.product_list_viewed',
          data: { listId: 'LIST-1', listName: 'Featured Products' },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.list_id).toBe('LIST-1');
      expect(properties.category).toBe('Featured Products');
    });
  });

  describe('customDimensions', () => {
    it('merges customDimensions into track properties', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          customDimensions: { dimension1: 'val1', dimension2: 42 },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.dimension1).toBe('val1');
      expect(properties.dimension2).toBe(42);
    });

    it('merges customDimensions into page properties', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          customDimensions: { source: 'organic' },
        }),
      );
      const properties = analytics.page.mock.calls[0]?.[2];
      expect(properties.source).toBe('organic');
    });
  });

  describe('includeMetadata option', () => {
    it('does not include metadata by default', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.odl_event_id).toBeUndefined();
      expect(properties.odl_timestamp).toBeUndefined();
    });

    it('includes odl_event_id and odl_timestamp when includeMetadata is true', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics, includeMetadata: true });
      plugin.afterEvent?.(makeEvent({ event: 'custom.click' }));
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.odl_event_id).toBe('test-id-123');
      expect(properties.odl_timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('includes metadata in page events when includeMetadata is true', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics, includeMetadata: true });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      const properties = analytics.page.mock.calls[0]?.[2];
      expect(properties.odl_event_id).toBe('test-id-123');
      expect(properties.odl_timestamp).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('autoIdentify', () => {
    it('calls identify when user context has an id (autoIdentify: true by default)', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'user-123', email: 'test@example.com', name: 'Test User' } },
        }),
      );
      expect(analytics.identify).toHaveBeenCalledWith('user-123', {
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('does not re-identify the same user on subsequent events', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      const ctx = { user: { id: 'user-123', email: 'test@example.com' } };
      plugin.afterEvent?.(makeEvent({ context: ctx }));
      plugin.afterEvent?.(makeEvent({ context: ctx }));
      plugin.afterEvent?.(makeEvent({ context: ctx }));
      expect(analytics.identify).toHaveBeenCalledTimes(1);
    });

    it('re-identifies when user id changes', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-1' } } }));
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-2' } } }));
      expect(analytics.identify).toHaveBeenCalledTimes(2);
      expect(analytics.identify).toHaveBeenNthCalledWith(1, 'user-1', {});
      expect(analytics.identify).toHaveBeenNthCalledWith(2, 'user-2', {});
    });

    it('does not call identify when autoIdentify is false', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics, autoIdentify: false });
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-123' } } }));
      expect(analytics.identify).not.toHaveBeenCalled();
    });

    it('does not call identify when context has no user', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ context: { page: { path: '/home' } } }));
      expect(analytics.identify).not.toHaveBeenCalled();
    });

    it('does not call identify when user has no id', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(makeEvent({ context: { user: { email: 'anon@test.com' } } }));
      expect(analytics.identify).not.toHaveBeenCalled();
    });

    it('extracts user traits: email, name, firstName, lastName, phone, company, createdAt', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          context: {
            user: {
              id: 'u1',
              email: 'jane@example.com',
              name: 'Jane Doe',
              firstName: 'Jane',
              lastName: 'Doe',
              phone: '+1234567890',
              company: 'Acme Inc',
              createdAt: '2024-01-01',
            },
          },
        }),
      );
      expect(analytics.identify).toHaveBeenCalledWith('u1', {
        email: 'jane@example.com',
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1234567890',
        company: 'Acme Inc',
        createdAt: '2024-01-01',
      });
    });
  });

  describe('user.identified event', () => {
    it('calls analytics.identify with userId and traits', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: {
            userId: 'explicit-user-1',
            traits: { email: 'explicit@test.com', plan: 'pro' },
          },
        }),
      );
      expect(analytics.identify).toHaveBeenCalledWith('explicit-user-1', {
        email: 'explicit@test.com',
        plan: 'pro',
      });
    });

    it('calls analytics.identify with traits only when no userId', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { traits: { email: 'anon@test.com' } },
        }),
      );
      expect(analytics.identify).toHaveBeenCalledWith({ email: 'anon@test.com' });
    });

    it('does not call track() for user.identified event', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { userId: 'u1', traits: {} },
        }),
      );
      expect(analytics.track).not.toHaveBeenCalled();
    });
  });

  describe('user.group_identified event', () => {
    it('calls analytics.group() with groupId and traits', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: {
            groupId: 'org-456',
            traits: { name: 'Acme Corp', plan: 'enterprise' },
          },
        }),
      );
      expect(analytics.group).toHaveBeenCalledWith('org-456', {
        name: 'Acme Corp',
        plan: 'enterprise',
      });
    });

    it('does not call group() when groupId is missing', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { traits: { name: 'No ID Group' } },
        }),
      );
      expect(analytics.group).not.toHaveBeenCalled();
    });

    it('does not call track() for user.group_identified event', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupId: 'org-1', traits: {} },
        }),
      );
      expect(analytics.track).not.toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    it('resets lastIdentifiedUserId so next event re-identifies', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });

      // First identification
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-1' } } }));
      expect(analytics.identify).toHaveBeenCalledTimes(1);

      // Same user should not re-identify
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-1' } } }));
      expect(analytics.identify).toHaveBeenCalledTimes(1);

      // After destroy, same user should re-identify
      plugin.destroy?.();
      plugin.afterEvent?.(makeEvent({ context: { user: { id: 'user-1' } } }));
      expect(analytics.identify).toHaveBeenCalledTimes(2);
    });
  });

  describe('no analytics instance', () => {
    it('does not error when analytics is undefined', () => {
      const plugin = segmentAdapter({});
      expect(() => plugin.afterEvent?.(makeEvent({ event: 'page.view' }))).not.toThrow();
      expect(() => plugin.afterEvent?.(makeEvent({ event: 'custom.event' }))).not.toThrow();
    });

    it('does not error for user.identified when analytics is undefined', () => {
      const plugin = segmentAdapter({});
      expect(() =>
        plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'u1' } })),
      ).not.toThrow();
    });

    it('does not error for user.group_identified when analytics is undefined', () => {
      const plugin = segmentAdapter({});
      expect(() =>
        plugin.afterEvent?.(makeEvent({ event: 'user.group_identified', data: { groupId: 'g1' } })),
      ).not.toThrow();
    });
  });

  describe('non-ecommerce events pass data through as properties', () => {
    it('passes event data as track properties', () => {
      const analytics = createMockAnalytics();
      const plugin = segmentAdapter({ analyticsInstance: analytics });
      plugin.afterEvent?.(
        makeEvent({
          event: 'form.submitted',
          data: { formId: 'contact-form', fields: 5 },
        }),
      );
      const properties = analytics.track.mock.calls[0]?.[1];
      expect(properties.formId).toBe('contact-form');
      expect(properties.fields).toBe(5);
    });
  });
});
