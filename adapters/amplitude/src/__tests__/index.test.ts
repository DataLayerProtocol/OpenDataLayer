/**
 * Tests for @opendatalayer/adapter-amplitude
 */

declare const globalThis: { window?: Record<string, unknown> };

import { amplitudeAdapter } from '../index.js';

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

function createMockAmplitude() {
  const identifyInstance = { set: vi.fn().mockReturnThis() };
  const revenueInstance = {
    setProductId: vi.fn().mockReturnThis(),
    setPrice: vi.fn().mockReturnThis(),
    setQuantity: vi.fn().mockReturnThis(),
    setRevenueType: vi.fn().mockReturnThis(),
    setEventProperties: vi.fn().mockReturnThis(),
  };
  return {
    track: vi.fn(),
    identify: vi.fn(),
    setUserId: vi.fn(),
    setGroup: vi.fn(),
    revenue: vi.fn(),
    Identify: vi.fn().mockImplementation(() => identifyInstance),
    Revenue: vi.fn().mockImplementation(() => revenueInstance),
    _identifyInstance: identifyInstance,
    _revenueInstance: revenueInstance,
  };
}

beforeEach(() => {
  globalThis.window = {} as any;
});

afterEach(() => {
  globalThis.window = undefined;
});

describe('amplitudeAdapter', () => {
  // ─── Plugin Structure ──────────────────────────────────────────────

  describe('plugin structure', () => {
    it('returns a plugin with name "amplitude-adapter"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      expect(plugin.name).toBe('amplitude-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  // ─── Event Name Mapping (Defaults) ────────────────────────────────

  describe('event name mapping', () => {
    it('maps page.view to "Page Viewed"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'page.view' }));
      expect(amp.track).toHaveBeenCalledWith('Page Viewed', expect.any(Object));
    });

    it('maps page.virtual_view to "Virtual Page Viewed"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      expect(amp.track).toHaveBeenCalledWith('Virtual Page Viewed', expect.any(Object));
    });

    it('maps ecommerce.product_viewed to "Product Viewed"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_viewed', data: {} }));
      expect(amp.track).toHaveBeenCalledWith('Product Viewed', expect.any(Object));
    });

    it('maps ecommerce.product_added to "Product Added"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.product_added', data: {} }));
      expect(amp.track).toHaveBeenCalledWith('Product Added', expect.any(Object));
    });

    it('maps ecommerce.checkout_started to "Checkout Started"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.checkout_started', data: {} }));
      expect(amp.track).toHaveBeenCalledWith('Checkout Started', expect.any(Object));
    });

    it('maps user.signed_up to "Sign Up"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_up' }));
      expect(amp.track).toHaveBeenCalledWith('Sign Up', expect.any(Object));
    });

    it('maps user.signed_in to "Sign In"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_in' }));
      expect(amp.track).toHaveBeenCalledWith('Sign In', expect.any(Object));
    });

    it('maps search.performed to "Search"', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      expect(amp.track).toHaveBeenCalledWith('Search', expect.any(Object));
    });

    it('title-cases the last segment of unmapped events (form.submitted -> "Submitted")', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'form.submitted' }));
      expect(amp.track).toHaveBeenCalledWith('Submitted', expect.any(Object));
    });

    it('title-cases underscore-separated last segment (custom.my_cool_event -> "My Cool Event")', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'custom.my_cool_event' }));
      expect(amp.track).toHaveBeenCalledWith('My Cool Event', expect.any(Object));
    });

    it('allows custom eventNameMap to override defaults', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({
        amplitudeInstance: amp,
        eventNameMap: { 'ecommerce.purchase': 'Custom Purchase' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'ecommerce.purchase', data: { products: [] } }));
      expect(amp.track).toHaveBeenCalledWith('Custom Purchase', expect.any(Object));
    });

    it('custom eventNameMap preserves non-overridden defaults', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({
        amplitudeInstance: amp,
        eventNameMap: { 'ecommerce.purchase': 'Custom Purchase' },
      });
      plugin.afterEvent?.(makeEvent({ event: 'search.performed' }));
      expect(amp.track).toHaveBeenCalledWith('Search', expect.any(Object));
    });
  });

  // ─── User Identification ──────────────────────────────────────────

  describe('user.identified event', () => {
    it('calls setUserId with the userId from event data', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { userId: 'user-abc' },
        }),
      );
      expect(amp.setUserId).toHaveBeenCalledWith('user-abc');
    });

    it('calls identify with traits using Identify.set()', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: {
            userId: 'user-abc',
            traits: { email: 'test@example.com', plan: 'pro' },
          },
        }),
      );
      expect(amp.Identify).toHaveBeenCalledTimes(1);
      expect(amp._identifyInstance.set).toHaveBeenCalledWith('email', 'test@example.com');
      expect(amp._identifyInstance.set).toHaveBeenCalledWith('plan', 'pro');
      expect(amp.identify).toHaveBeenCalledWith(amp._identifyInstance);
    });

    it('does not call setUserId when userId is missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { traits: { email: 'anon@test.com' } },
        }),
      );
      expect(amp.setUserId).not.toHaveBeenCalled();
    });

    it('does not call identify when traits are missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { userId: 'user-abc' },
        }),
      );
      expect(amp.identify).not.toHaveBeenCalled();
    });

    it('deduplicates: does not call setUserId again for the same user', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      const event = makeEvent({
        event: 'user.identified',
        data: { userId: 'user-abc' },
      });
      plugin.afterEvent?.(event);
      plugin.afterEvent?.(event);
      plugin.afterEvent?.(event);
      expect(amp.setUserId).toHaveBeenCalledTimes(1);
    });

    it('re-identifies when user id changes', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-2' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(2);
      expect(amp.setUserId).toHaveBeenNthCalledWith(1, 'user-1');
      expect(amp.setUserId).toHaveBeenNthCalledWith(2, 'user-2');
    });

    it('does not call track() for user.identified events', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.identified',
          data: { userId: 'user-abc', traits: { email: 'a@b.com' } },
        }),
      );
      expect(amp.track).not.toHaveBeenCalled();
    });
  });

  // ─── User Sign Out ────────────────────────────────────────────────

  describe('user.signed_out event', () => {
    it('calls setUserId(null) to reset the user', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_out' }));
      expect(amp.setUserId).toHaveBeenCalledWith(null);
    });

    it('tracks a "Sign Out" event', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.signed_out' }));
      expect(amp.track).toHaveBeenCalledWith('Sign Out');
    });

    it('resets dedup state so the same user can re-identify after sign out', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(1);

      plugin.afterEvent?.(makeEvent({ event: 'user.signed_out' }));

      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(3); // identify + signout null + re-identify
    });
  });

  // ─── Ecommerce Purchase ───────────────────────────────────────────

  describe('ecommerce.purchase event', () => {
    it('calls revenue() for each product in the products array', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-123',
            products: [
              { id: 'P1', price: 10, quantity: 2 },
              { id: 'P2', price: 25, quantity: 1 },
            ],
          },
        }),
      );
      expect(amp.Revenue).toHaveBeenCalledTimes(2);
      expect(amp.revenue).toHaveBeenCalledTimes(2);
    });

    it('sets productId from product.id', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'PROD-1', price: 10 }] },
        }),
      );
      expect(amp._revenueInstance.setProductId).toHaveBeenCalledWith('PROD-1');
    });

    it('falls back to sku for productId when id is missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ sku: 'SKU-99', price: 10 }] },
        }),
      );
      expect(amp._revenueInstance.setProductId).toHaveBeenCalledWith('SKU-99');
    });

    it('falls back to name for productId when id and sku are missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ name: 'Widget', price: 10 }] },
        }),
      );
      expect(amp._revenueInstance.setProductId).toHaveBeenCalledWith('Widget');
    });

    it('sets price and quantity on the Revenue instance', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', price: 49.99, quantity: 3 }] },
        }),
      );
      expect(amp._revenueInstance.setPrice).toHaveBeenCalledWith(49.99);
      expect(amp._revenueInstance.setQuantity).toHaveBeenCalledWith(3);
    });

    it('defaults quantity to 1 when not provided', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', price: 10 }] },
        }),
      );
      expect(amp._revenueInstance.setQuantity).toHaveBeenCalledWith(1);
    });

    it('sets revenueType when provided on the product', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', price: 10, revenueType: 'subscription' }] },
        }),
      );
      expect(amp._revenueInstance.setRevenueType).toHaveBeenCalledWith('subscription');
    });

    it('does not call setRevenueType when revenueType is not provided', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', price: 10 }] },
        }),
      );
      expect(amp._revenueInstance.setRevenueType).not.toHaveBeenCalled();
    });

    it('sets extra product properties via setEventProperties', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            products: [
              {
                id: 'P1',
                price: 10,
                quantity: 1,
                name: 'Widget',
                brand: 'Acme',
                category: 'Tools',
              },
            ],
          },
        }),
      );
      expect(amp._revenueInstance.setEventProperties).toHaveBeenCalledWith({
        name: 'Widget',
        brand: 'Acme',
        category: 'Tools',
      });
    });

    it('does not call setEventProperties when no extra properties exist', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { products: [{ id: 'P1', price: 10, quantity: 1 }] },
        }),
      );
      expect(amp._revenueInstance.setEventProperties).not.toHaveBeenCalled();
    });

    it('also calls track("Purchase") with flattened event properties', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: {
            orderId: 'ORD-1',
            total: 75.0,
            currency: 'USD',
            products: [{ id: 'P1', price: 75 }],
          },
        }),
      );
      expect(amp.track).toHaveBeenCalledWith(
        'Purchase',
        expect.objectContaining({
          orderId: 'ORD-1',
          total: 75.0,
          currency: 'USD',
        }),
      );
    });

    it('does not call revenue when products is not an array', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-1', total: 50 },
        }),
      );
      expect(amp.revenue).not.toHaveBeenCalled();
      // track should still be called
      expect(amp.track).toHaveBeenCalledWith('Purchase', expect.any(Object));
    });
  });

  // ─── Page View Tracking ───────────────────────────────────────────

  describe('page events', () => {
    it('calls track("Page Viewed") for page.view', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'page.view', data: { title: 'Home', url: '/home' } }));
      expect(amp.track).toHaveBeenCalledWith('Page Viewed', { title: 'Home', url: '/home' });
    });

    it('calls track for any page.* event', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'page.virtual_view' }));
      expect(amp.track).toHaveBeenCalledWith('Virtual Page Viewed', {});
    });

    it('includes data properties in page track calls', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          data: { path: '/about', referrer: 'https://google.com' },
        }),
      );
      expect(amp.track).toHaveBeenCalledWith('Page Viewed', {
        path: '/about',
        referrer: 'https://google.com',
      });
    });
  });

  // ─── Group Identification ─────────────────────────────────────────

  describe('user.group_identified event', () => {
    it('calls setGroup with groupType and groupName', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupType: 'company', groupName: 'Acme Corp' },
        }),
      );
      expect(amp.setGroup).toHaveBeenCalledWith('company', 'Acme Corp');
    });

    it('supports string array as groupName', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupType: 'team', groupName: ['Alpha', 'Beta'] },
        }),
      );
      expect(amp.setGroup).toHaveBeenCalledWith('team', ['Alpha', 'Beta']);
    });

    it('does not call setGroup when groupType is missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupName: 'Acme' },
        }),
      );
      expect(amp.setGroup).not.toHaveBeenCalled();
    });

    it('does not call setGroup when groupName is missing', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupType: 'company' },
        }),
      );
      expect(amp.setGroup).not.toHaveBeenCalled();
    });

    it('does not call track() for user.group_identified', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'user.group_identified',
          data: { groupType: 'company', groupName: 'Acme' },
        }),
      );
      expect(amp.track).not.toHaveBeenCalled();
    });
  });

  // ─── Generic Event Tracking ───────────────────────────────────────

  describe('generic event tracking', () => {
    it('calls track() with resolved name and flattened properties', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'interaction.button_clicked',
          data: { buttonId: 'cta-main', label: 'Get Started' },
        }),
      );
      expect(amp.track).toHaveBeenCalledWith('Button Clicked', {
        buttonId: 'cta-main',
        label: 'Get Started',
      });
    });

    it('passes empty object when event has no data', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(makeEvent({ event: 'custom.ping' }));
      expect(amp.track).toHaveBeenCalledWith('Ping', {});
    });
  });

  // ─── Auto User Properties from context.user ──────────────────────

  describe('autoSetUserProperties', () => {
    it('creates an Identify from context.user properties (excluding id)', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          context: {
            user: { id: 'u1', email: 'jane@test.com', name: 'Jane', plan: 'enterprise' },
          },
        }),
      );
      expect(amp.Identify).toHaveBeenCalled();
      expect(amp._identifyInstance.set).toHaveBeenCalledWith('email', 'jane@test.com');
      expect(amp._identifyInstance.set).toHaveBeenCalledWith('name', 'Jane');
      expect(amp._identifyInstance.set).toHaveBeenCalledWith('plan', 'enterprise');
      // Should NOT set 'id'
      expect(amp._identifyInstance.set).not.toHaveBeenCalledWith('id', expect.anything());
      expect(amp.identify).toHaveBeenCalledWith(amp._identifyInstance);
    });

    it('does not call identify when context.user has only id', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1' } },
        }),
      );
      // No entries after filtering out 'id', so identify should not be called
      expect(amp.identify).not.toHaveBeenCalled();
    });

    it('does not call identify when context has no user', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          context: { page: { path: '/home' } },
        }),
      );
      expect(amp.identify).not.toHaveBeenCalled();
    });

    it('does not apply user properties when autoSetUserProperties is false', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({
        amplitudeInstance: amp,
        autoSetUserProperties: false,
      });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1', email: 'test@test.com' } },
        }),
      );
      // Identify should not be called for auto user properties
      // (only explicitly via user.identified would it be called)
      expect(amp.identify).not.toHaveBeenCalled();
    });
  });

  // ─── Custom Dimensions ────────────────────────────────────────────

  describe('customDimensions', () => {
    it('merges customDimensions into track event properties', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { action: 'click' },
          customDimensions: { dimension1: 'val1', dimension2: 42 },
        }),
      );
      const props = amp.track.mock.calls[0]?.[1];
      expect(props.action).toBe('click');
      expect(props.dimension1).toBe('val1');
      expect(props.dimension2).toBe(42);
    });

    it('customDimensions override data properties with the same key', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { source: 'internal' },
          customDimensions: { source: 'override' },
        }),
      );
      const props = amp.track.mock.calls[0]?.[1];
      expect(props.source).toBe('override');
    });
  });

  // ─── Data Flattening ──────────────────────────────────────────────

  describe('data flattening', () => {
    it('flattens nested objects using underscore-separated keys', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { page: { title: 'Home', meta: { author: 'Jane' } } },
        }),
      );
      const props = amp.track.mock.calls[0]?.[1];
      expect(props.page_title).toBe('Home');
      expect(props.page_meta_author).toBe('Jane');
    });

    it('preserves arrays as-is', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { tags: ['a', 'b', 'c'] },
        }),
      );
      const props = amp.track.mock.calls[0]?.[1];
      expect(props.tags).toEqual(['a', 'b', 'c']);
    });

    it('preserves null values', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.action',
          data: { value: null },
        }),
      );
      const props = amp.track.mock.calls[0]?.[1];
      expect(props.value).toBeNull();
    });
  });

  // ─── SSR Safety ───────────────────────────────────────────────────

  describe('SSR safety', () => {
    it('does not error when window is undefined', () => {
      globalThis.window = undefined;
      const plugin = amplitudeAdapter();
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();
    });

    it('does not error when window is undefined for user.identified', () => {
      globalThis.window = undefined;
      const plugin = amplitudeAdapter();
      expect(() =>
        plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'u1' } })),
      ).not.toThrow();
    });

    it('does not error when window is undefined for ecommerce.purchase', () => {
      globalThis.window = undefined;
      const plugin = amplitudeAdapter();
      expect(() =>
        plugin.afterEvent?.(
          makeEvent({
            event: 'ecommerce.purchase',
            data: { products: [{ id: 'P1', price: 10 }] },
          }),
        ),
      ).not.toThrow();
    });
  });

  // ─── SDK Not Found Warning ────────────────────────────────────────

  describe('initialize warning', () => {
    it('warns when amplitude SDK is not found on window', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.window = {} as any;
      const plugin = amplitudeAdapter();
      plugin.initialize?.(undefined);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Amplitude SDK not found'));
      warnSpy.mockRestore();
    });

    it('does not warn when amplitudeInstance is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });
      plugin.initialize?.(undefined);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('does not warn during SSR (window undefined)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.window = undefined;
      const plugin = amplitudeAdapter();
      plugin.initialize?.(undefined);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ─── Custom amplitudeInstance Option ──────────────────────────────

  describe('custom amplitudeInstance option', () => {
    it('uses the provided amplitudeInstance instead of window.amplitude', () => {
      const windowAmp = createMockAmplitude();
      const customAmp = createMockAmplitude();
      (globalThis.window as any).amplitude = windowAmp;

      const plugin = amplitudeAdapter({ amplitudeInstance: customAmp });
      plugin.afterEvent?.(makeEvent({ event: 'custom.click', data: { btn: 'ok' } }));

      expect(customAmp.track).toHaveBeenCalledWith('Click', { btn: 'ok' });
      expect(windowAmp.track).not.toHaveBeenCalled();
    });

    it('falls back to window.amplitude when no amplitudeInstance is given', () => {
      const windowAmp = createMockAmplitude();
      (globalThis.window as any).amplitude = windowAmp;

      const plugin = amplitudeAdapter();
      plugin.afterEvent?.(makeEvent({ event: 'custom.click', data: { btn: 'ok' } }));

      expect(windowAmp.track).toHaveBeenCalledWith('Click', { btn: 'ok' });
    });
  });

  // ─── Destroy ──────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('resets lastIdentifiedUserId so the same user re-identifies after destroy', () => {
      const amp = createMockAmplitude();
      const plugin = amplitudeAdapter({ amplitudeInstance: amp });

      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(1);

      // Same user should be deduped
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(1);

      // After destroy, same user should re-identify
      plugin.destroy?.();
      plugin.afterEvent?.(makeEvent({ event: 'user.identified', data: { userId: 'user-1' } }));
      expect(amp.setUserId).toHaveBeenCalledTimes(2);
    });

    it('can be called without error', () => {
      const plugin = amplitudeAdapter();
      expect(() => plugin.destroy?.()).not.toThrow();
    });
  });
});
