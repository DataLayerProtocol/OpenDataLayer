/**
 * Valid ecommerce event fixtures for testing.
 */

import { createFullContext, createProduct, testUUID } from '../../helpers.js';
import type { CapturedEvent } from '../../spy.js';

export const ecommerceEvents: CapturedEvent[] = [
  {
    event: 'ecommerce.product_viewed',
    id: testUUID(200),
    timestamp: '2024-01-15T11:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      product: createProduct(),
    },
  },
  {
    event: 'ecommerce.product_added',
    id: testUUID(201),
    timestamp: '2024-01-15T11:05:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      product: createProduct({
        productId: 'SKU-003',
        name: 'Premium Widget',
        price: 49.99,
      }),
      cartId: 'cart-abc-123',
    },
  },
  {
    event: 'ecommerce.purchase',
    id: testUUID(202),
    timestamp: '2024-01-15T11:15:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      orderId: 'ORD-2024-001',
      total: 99.97,
      subtotal: 89.97,
      tax: 7.5,
      shipping: 2.5,
      currency: 'USD',
      coupon: 'WELCOME10',
      products: [
        createProduct(),
        createProduct({
          productId: 'SKU-003',
          name: 'Premium Widget',
          price: 49.99,
          quantity: 1,
          position: 2,
        }),
        createProduct({
          productId: 'SKU-004',
          name: 'Widget Accessory',
          price: 9.99,
          quantity: 1,
          position: 3,
        }),
      ],
    },
  },
  {
    event: 'ecommerce.cart_viewed',
    id: testUUID(203),
    timestamp: '2024-01-15T11:10:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      cartId: 'cart-abc-123',
      products: [
        createProduct(),
        createProduct({
          productId: 'SKU-003',
          name: 'Premium Widget',
          price: 49.99,
          quantity: 1,
          position: 2,
        }),
      ],
    },
  },
];
