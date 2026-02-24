/**
 * Test helper functions for creating valid ODL events and contexts.
 */

import type { CapturedEvent } from './spy.js';

/**
 * Generate a deterministic UUID for testing.
 * Produces a v4-formatted UUID seeded by a simple numeric value.
 */
export function testUUID(seed = 0): string {
  // Deterministic hex from seed for reproducible tests
  const hex = (n: number): string => {
    const h = ((n * 2654435761) >>> 0).toString(16).padStart(8, '0');
    return h;
  };

  const a = hex(seed);
  const b = hex(seed + 1);
  const c = hex(seed + 2);
  const d = hex(seed + 3);

  return [
    a.slice(0, 8),
    b.slice(0, 4),
    `4${c.slice(1, 4)}`,
    ((Number.parseInt(c[4] ?? '0', 16) & 0x3) | 0x8).toString(16) + c.slice(5, 8),
    d.slice(0, 8) + a.slice(0, 4),
  ].join('-');
}

/** Create a minimal valid ODL event */
export function createTestEvent(overrides?: Partial<CapturedEvent>): CapturedEvent {
  return {
    event: 'test.event',
    id: testUUID(0),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

/** Create a valid page context */
export function createPageContext(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    url: 'https://example.com/products/widget',
    path: '/products/widget',
    title: 'Widget - Example Store',
    referrer: 'https://example.com/',
    ...overrides,
  };
}

/** Create a valid user context */
export function createUserContext(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'user-12345',
    anonymousId: testUUID(10),
    isAuthenticated: true,
    traits: {
      email: 'test@example.com',
      name: 'Test User',
      plan: 'premium',
    },
    ...overrides,
  };
}

/** Create a valid consent context (granted) */
export function createConsentContext(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    status: 'granted',
    purposes: {
      analytics: true,
      marketing: true,
      functional: true,
      personalization: false,
    },
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

/** Create a valid session context */
export function createSessionContext(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: testUUID(20),
    isNew: false,
    count: 5,
    startedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

/** Create a full context with all objects populated */
export function createFullContext(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    page: createPageContext(),
    user: createUserContext(),
    consent: createConsentContext(),
    session: createSessionContext(),
    ...overrides,
  };
}

/** Create a valid ecommerce product */
export function createProduct(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'SKU-001',
    name: 'Test Widget',
    brand: 'WidgetCo',
    category: 'Electronics/Gadgets',
    variant: 'Blue',
    price: 29.99,
    currency: 'USD',
    quantity: 1,
    position: 1,
    ...overrides,
  };
}

/** Create a valid purchase event */
export function createPurchaseEvent(overrides?: Partial<CapturedEvent>): CapturedEvent {
  return createTestEvent({
    event: 'ecommerce.purchase',
    data: {
      orderId: 'ORD-2024-001',
      total: 64.97,
      subtotal: 59.97,
      tax: 5.0,
      shipping: 0.0,
      currency: 'USD',
      coupon: 'SAVE10',
      products: [
        createProduct(),
        createProduct({
          id: 'SKU-002',
          name: 'Test Gadget',
          brand: 'GadgetCo',
          category: 'Electronics/Gadgets',
          variant: 'Red',
          price: 19.99,
          quantity: 1,
          position: 2,
        }),
        createProduct({
          id: 'SKU-001',
          name: 'Test Widget',
          quantity: 1,
          position: 3,
        }),
      ],
    },
    context: createFullContext(),
    ...overrides,
  });
}
