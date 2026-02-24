import {
  createConsentContext,
  createFullContext,
  createPageContext,
  createProduct,
  createPurchaseEvent,
  createSessionContext,
  createTestEvent,
  createUserContext,
  testUUID,
} from '../helpers.js';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('testUUID()', () => {
  it('returns a string in UUID v4 format', () => {
    const uuid = testUUID();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('is deterministic - same seed produces same result', () => {
    const a = testUUID(42);
    const b = testUUID(42);
    expect(a).toBe(b);
  });

  it('different seeds produce different UUIDs', () => {
    const a = testUUID(0);
    const b = testUUID(100);
    expect(a).not.toBe(b);
  });
});

describe('createTestEvent()', () => {
  it('returns a valid event with all required fields', () => {
    const event = createTestEvent();

    expect(event).toHaveProperty('event');
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('specVersion');
    expect(typeof event.event).toBe('string');
    expect(typeof event.id).toBe('string');
    expect(typeof event.timestamp).toBe('string');
    expect(typeof event.specVersion).toBe('string');
  });

  it('accepts overrides', () => {
    const event = createTestEvent({
      event: 'custom.event',
      data: { key: 'value' },
    });

    expect(event.event).toBe('custom.event');
    expect(event.data).toEqual({ key: 'value' });
    // Non-overridden fields still present
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.specVersion).toBe('1.0.0');
  });
});

describe('createPageContext()', () => {
  it('returns a page context with url, path, title, referrer', () => {
    const ctx = createPageContext();

    expect(ctx).toHaveProperty('url');
    expect(ctx).toHaveProperty('path');
    expect(ctx).toHaveProperty('title');
    expect(ctx).toHaveProperty('referrer');
    expect(typeof ctx.url).toBe('string');
    expect(typeof ctx.path).toBe('string');
    expect(typeof ctx.title).toBe('string');
    expect(typeof ctx.referrer).toBe('string');
  });

  it('accepts overrides', () => {
    const ctx = createPageContext({ title: 'Custom Title', path: '/custom' });

    expect(ctx.title).toBe('Custom Title');
    expect(ctx.path).toBe('/custom');
    // Non-overridden fields still present
    expect(ctx.url).toBeDefined();
  });
});

describe('createUserContext()', () => {
  it('returns a user context with id, anonymousId, isAuthenticated, traits', () => {
    const ctx = createUserContext();

    expect(ctx).toHaveProperty('id');
    expect(ctx).toHaveProperty('anonymousId');
    expect(ctx).toHaveProperty('isAuthenticated');
    expect(ctx).toHaveProperty('traits');
    expect(typeof ctx.id).toBe('string');
    expect(typeof ctx.anonymousId).toBe('string');
    expect(ctx.isAuthenticated).toBe(true);
    expect(typeof ctx.traits).toBe('object');
  });
});

describe('createConsentContext()', () => {
  it('returns a consent context with status, purposes, and updatedAt', () => {
    const ctx = createConsentContext();

    expect(ctx).toHaveProperty('status');
    expect(ctx).toHaveProperty('purposes');
    expect(ctx).toHaveProperty('updatedAt');
    expect(ctx.status).toBe('granted');
    expect(typeof ctx.purposes).toBe('object');
    expect(typeof ctx.updatedAt).toBe('string');
  });
});

describe('createSessionContext()', () => {
  it('returns a session context with id, isNew, count, startedAt', () => {
    const ctx = createSessionContext();

    expect(ctx).toHaveProperty('id');
    expect(ctx).toHaveProperty('isNew');
    expect(ctx).toHaveProperty('count');
    expect(ctx).toHaveProperty('startedAt');
    expect(typeof ctx.id).toBe('string');
    expect(typeof ctx.isNew).toBe('boolean');
    expect(typeof ctx.count).toBe('number');
    expect(typeof ctx.startedAt).toBe('string');
  });
});

describe('createFullContext()', () => {
  it('returns a context with page, user, consent, session keys', () => {
    const ctx = createFullContext();

    expect(ctx).toHaveProperty('page');
    expect(ctx).toHaveProperty('user');
    expect(ctx).toHaveProperty('consent');
    expect(ctx).toHaveProperty('session');

    // Each sub-context should be a populated object
    expect(typeof ctx.page).toBe('object');
    expect(typeof ctx.user).toBe('object');
    expect(typeof ctx.consent).toBe('object');
    expect(typeof ctx.session).toBe('object');
  });
});

describe('createProduct()', () => {
  it('returns a product with id, name, brand, category, variant, price, currency, quantity, position', () => {
    const product = createProduct();

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('brand');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('variant');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('currency');
    expect(product).toHaveProperty('quantity');
    expect(product).toHaveProperty('position');
    expect(typeof product.id).toBe('string');
    expect(typeof product.name).toBe('string');
    expect(typeof product.brand).toBe('string');
    expect(typeof product.category).toBe('string');
    expect(typeof product.variant).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(typeof product.currency).toBe('string');
    expect(typeof product.quantity).toBe('number');
    expect(typeof product.position).toBe('number');
  });
});

describe('createPurchaseEvent()', () => {
  it('returns an ecommerce.purchase event with orderId, products array, and full context', () => {
    const event = createPurchaseEvent();

    expect(event.event).toBe('ecommerce.purchase');
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.specVersion).toBe('1.0.0');

    // Data with purchase details
    expect(event.data).toBeDefined();
    expect(event.data?.orderId).toBeDefined();
    expect(typeof event.data?.orderId).toBe('string');
    expect(Array.isArray(event.data?.products)).toBe(true);
    expect((event.data?.products as unknown[]).length).toBeGreaterThan(0);

    // Full context present
    expect(event.context).toBeDefined();
    expect(event.context).toHaveProperty('page');
    expect(event.context).toHaveProperty('user');
    expect(event.context).toHaveProperty('consent');
    expect(event.context).toHaveProperty('session');
  });
});
