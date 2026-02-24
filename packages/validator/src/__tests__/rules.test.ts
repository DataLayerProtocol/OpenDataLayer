import { consentBeforeTracking } from '../rules/consent-before-tracking.js';
import { ecommerceConsistency } from '../rules/ecommerce-consistency.js';
import { requiredContext } from '../rules/required-context.js';

// ---------------------------------------------------------------------------
// consent-before-tracking
// ---------------------------------------------------------------------------

describe('consent-before-tracking rule', () => {
  const rule = consentBeforeTracking;

  describe('exempt events', () => {
    it('returns no warnings for consent.* events', () => {
      const event = { event: 'consent.given' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for consent.revoked events', () => {
      const event = { event: 'consent.revoked' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for consent.preferences_updated events', () => {
      const event = { event: 'consent.preferences_updated' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('non-tracking namespaces', () => {
    it('returns no warnings for page.* events (not a tracking namespace)', () => {
      const event = { event: 'page.view' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for error.* events', () => {
      const event = { event: 'error.occurred' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for custom.* events', () => {
      const event = { event: 'custom.something' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('tracking events without consent context', () => {
    it('warns for ecommerce.* event without consent context', () => {
      const event = { event: 'ecommerce.purchase' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
      expect(warnings[0].rule).toBe('consent-before-tracking');
      expect(warnings[0].message).toContain('ecommerce.purchase');
      expect(warnings[0].message).toContain('without consent context');
    });

    it('warns for user.* event without consent context', () => {
      const event = { event: 'user.signed_in' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
      expect(warnings[0].rule).toBe('consent-before-tracking');
    });

    it('warns for interaction.* event without consent context', () => {
      const event = { event: 'interaction.element_clicked' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns for media.* event without consent context', () => {
      const event = { event: 'media.play' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns for search.* event without consent context', () => {
      const event = { event: 'search.performed' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns for performance.* event without consent context', () => {
      const event = { event: 'performance.page_load' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns for form.* event without consent context', () => {
      const event = { event: 'form.submitted' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });
  });

  describe('all TRACKING_NAMESPACES are checked', () => {
    const trackingNamespaces = [
      'ecommerce',
      'user',
      'interaction',
      'media',
      'search',
      'performance',
      'form',
    ];

    it.each(trackingNamespaces)(
      'warns for %s.* event when consent context is missing',
      (namespace) => {
        const event = { event: `${namespace}.test_action` };
        const warnings = rule.validate(event, {});
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].rule).toBe('consent-before-tracking');
      },
    );
  });

  describe('tracking events with non-granted consent', () => {
    it('warns for user.* event with consent.status !== "granted"', () => {
      const event = { event: 'user.signed_in' };
      const context = { consent: { status: 'pending' } };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('consent.status="pending"');
    });

    it('warns when consent.status is "denied"', () => {
      const event = { event: 'ecommerce.purchase' };
      const context = { consent: { status: 'denied' } };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('consent.status="denied"');
    });

    it('warns when consent.status is undefined', () => {
      const event = { event: 'ecommerce.purchase' };
      const context = { consent: {} };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('consent.status="undefined"');
    });
  });

  describe('tracking events with granted consent', () => {
    it('returns no warning when consent.status === "granted"', () => {
      const event = { event: 'ecommerce.purchase' };
      const context = { consent: { status: 'granted' } };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for user.* with granted consent', () => {
      const event = { event: 'user.signed_in' };
      const context = { consent: { status: 'granted' } };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for media.* with granted consent', () => {
      const event = { event: 'media.play' };
      const context = { consent: { status: 'granted' } };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns no warnings when event field is not a string', () => {
      const event = { event: 42 } as unknown as Record<string, unknown>;
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings when event field is missing', () => {
      const warnings = rule.validate({});
      expect(warnings).toHaveLength(0);
    });

    it('warns when context is undefined for tracking event', () => {
      const event = { event: 'ecommerce.purchase' };
      const warnings = rule.validate(event, undefined);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('without consent context');
    });
  });
});

// ---------------------------------------------------------------------------
// ecommerce-consistency
// ---------------------------------------------------------------------------

describe('ecommerce-consistency rule', () => {
  const rule = ecommerceConsistency;

  describe('non-ecommerce events', () => {
    it('returns no warnings for page.* events', () => {
      const event = { event: 'page.view', data: { total: 100 } };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for user.* events', () => {
      const event = { event: 'user.signed_in', data: { revenue: 50 } };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings for consent.* events', () => {
      const event = { event: 'consent.given', data: {} };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('monetary values without currency', () => {
    it('warns when total is present but no currency', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', total: 99.99, products: [{ id: '1', price: 99.99 }] },
      };
      const warnings = rule.validate(event);
      const currencyWarnings = warnings.filter((w) => w.message.includes('no currency specified'));
      expect(currencyWarnings.length).toBeGreaterThan(0);
    });

    it('warns when revenue is present but no currency', () => {
      const event = {
        event: 'ecommerce.refund',
        data: { revenue: 50.0 },
      };
      const warnings = rule.validate(event);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('revenue');
    });

    it('warns when tax is present but no currency', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', tax: 5.0, products: [] },
      };
      const warnings = rule.validate(event);
      const currencyWarnings = warnings.filter((w) => w.message.includes('no currency specified'));
      expect(currencyWarnings.length).toBeGreaterThan(0);
    });

    it('warns when shipping is present but no currency', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', shipping: 10.0, products: [] },
      };
      const warnings = rule.validate(event);
      const currencyWarnings = warnings.filter((w) => w.message.includes('no currency specified'));
      expect(currencyWarnings.length).toBeGreaterThan(0);
    });

    it('warns when discount is present but no currency', () => {
      const event = {
        event: 'ecommerce.checkout_started',
        data: { discount: 15.0 },
      };
      const warnings = rule.validate(event);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('warns when price is present but no currency', () => {
      const event = {
        event: 'ecommerce.product_viewed',
        data: { price: 29.99 },
      };
      const warnings = rule.validate(event);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('lists all present monetary fields in the warning message', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', total: 100, tax: 10, shipping: 5, products: [] },
      };
      const warnings = rule.validate(event);
      const currencyWarning = warnings.find((w) => w.message.includes('no currency specified'));
      expect(currencyWarning).toBeDefined();
      expect(currencyWarning?.message).toContain('total');
      expect(currencyWarning?.message).toContain('tax');
      expect(currencyWarning?.message).toContain('shipping');
    });
  });

  describe('ecommerce.purchase with empty products array', () => {
    it('warns for ecommerce.purchase with empty products array', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', total: 100, currency: 'USD', products: [] },
      };
      const warnings = rule.validate(event);
      const emptyProductsWarning = warnings.find((w) => w.message.includes('empty products array'));
      expect(emptyProductsWarning).toBeDefined();
      expect(emptyProductsWarning?.rule).toBe('ecommerce-consistency');
    });

    it('does not warn about empty products on non-purchase ecommerce events', () => {
      const event = {
        event: 'ecommerce.cart_viewed',
        data: { products: [], currency: 'USD' },
      };
      const warnings = rule.validate(event);
      const emptyProductsWarning = warnings.find((w) => w.message.includes('empty products array'));
      expect(emptyProductsWarning).toBeUndefined();
    });
  });

  describe('products with prices but no event-level currency', () => {
    it('warns for products with prices but no event-level currency', () => {
      const event = {
        event: 'ecommerce.product_added',
        data: {
          products: [{ id: 'P1', name: 'Widget', price: 25.0 }],
        },
      };
      const warnings = rule.validate(event);
      const productPriceWarning = warnings.find((w) =>
        w.message.includes('products with prices but no currency'),
      );
      expect(productPriceWarning).toBeDefined();
    });

    it('does not warn about product prices when event-level currency is present', () => {
      const event = {
        event: 'ecommerce.product_added',
        data: {
          currency: 'EUR',
          products: [{ id: 'P1', name: 'Widget', price: 25.0 }],
        },
      };
      const warnings = rule.validate(event);
      const productPriceWarning = warnings.find((w) =>
        w.message.includes('products with prices but no currency'),
      );
      expect(productPriceWarning).toBeUndefined();
    });
  });

  describe('no warnings when currency is present', () => {
    it('returns no warnings when currency is present with monetary values', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: {
          orderId: 'ORD-1',
          total: 100,
          revenue: 90,
          tax: 10,
          shipping: 5,
          currency: 'USD',
          products: [{ id: 'P1', name: 'Widget', price: 95.0 }],
        },
      };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns no warnings when event field is not a string', () => {
      const event = { event: 42 } as unknown as Record<string, unknown>;
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings when data is missing', () => {
      const event = { event: 'ecommerce.purchase' };
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings when monetary values are not numbers', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', total: '100', products: [] },
      };
      const warnings = rule.validate(event);
      // 'total' is a string, not a number, so no monetary field is detected
      // Only the empty products warning should fire
      const currencyWarning = warnings.find((w) => w.message.includes('no currency specified'));
      expect(currencyWarning).toBeUndefined();
    });

    it('does not warn about empty currency string as valid currency', () => {
      const event = {
        event: 'ecommerce.purchase',
        data: { orderId: 'ORD-1', total: 100, currency: '', products: [] },
      };
      const warnings = rule.validate(event);
      const currencyWarning = warnings.find((w) => w.message.includes('no currency specified'));
      expect(currencyWarning).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// required-context
// ---------------------------------------------------------------------------

describe('required-context rule', () => {
  const rule = requiredContext;

  describe('page.* events', () => {
    it('warns for page.* event without context.page', () => {
      const event = { event: 'page.view' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
      expect(warnings[0].rule).toBe('required-context');
      expect(warnings[0].message).toContain('context.page is missing');
    });

    it('warns for page.leave without context.page', () => {
      const event = { event: 'page.leave' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns when context is undefined for page events', () => {
      const event = { event: 'page.view' };
      const warnings = rule.validate(event, undefined);
      expect(warnings).toHaveLength(1);
    });

    it('warns when context.page is null', () => {
      const event = { event: 'page.view' };
      const warnings = rule.validate(event, { page: null });
      expect(warnings).toHaveLength(1);
    });

    it('warns when context.page is a primitive (not an object)', () => {
      const event = { event: 'page.view' };
      const warnings = rule.validate(event, { page: 'not-an-object' });
      expect(warnings).toHaveLength(1);
    });

    it('returns no warning when context.page is present', () => {
      const event = { event: 'page.view' };
      const context = {
        page: { url: 'https://example.com', title: 'Test' },
      };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for page.virtual_view with page context', () => {
      const event = { event: 'page.virtual_view' };
      const context = {
        page: { url: 'https://example.com/app', title: 'SPA page' },
      };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('user.* events', () => {
    it('warns for user.* event without context.user', () => {
      const event = { event: 'user.signed_in' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
      expect(warnings[0].rule).toBe('required-context');
      expect(warnings[0].message).toContain('context.user is missing');
    });

    it('warns for user.signed_up without context.user', () => {
      const event = { event: 'user.signed_up' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(1);
    });

    it('warns when context.user is null', () => {
      const event = { event: 'user.identified' };
      const warnings = rule.validate(event, { user: null });
      expect(warnings).toHaveLength(1);
    });

    it('returns no warning when context.user is present', () => {
      const event = { event: 'user.signed_in' };
      const context = {
        user: { userId: 'U123', anonymousId: 'anon-456' },
      };
      const warnings = rule.validate(event, context);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('unrelated events (no required context)', () => {
    it('returns no warning for ecommerce.* events without page or user context', () => {
      const event = { event: 'ecommerce.purchase' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for consent.* events', () => {
      const event = { event: 'consent.given' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for interaction.* events', () => {
      const event = { event: 'interaction.element_clicked' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for media.* events', () => {
      const event = { event: 'media.play' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for search.* events', () => {
      const event = { event: 'search.performed' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for form.* events', () => {
      const event = { event: 'form.submitted' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for performance.* events', () => {
      const event = { event: 'performance.page_load' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });

    it('returns no warning for error.* events', () => {
      const event = { event: 'error.occurred' };
      const warnings = rule.validate(event, {});
      expect(warnings).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns no warnings when event field is not a string', () => {
      const event = { event: 123 } as unknown as Record<string, unknown>;
      const warnings = rule.validate(event);
      expect(warnings).toHaveLength(0);
    });

    it('returns no warnings when event field is missing', () => {
      const warnings = rule.validate({});
      expect(warnings).toHaveLength(0);
    });
  });
});
