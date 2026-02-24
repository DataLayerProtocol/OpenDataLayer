/**
 * Invalid event fixtures - missing required fields.
 * These are intentionally invalid and typed loosely for testing validation.
 */

import { testUUID } from '../../helpers.js';

export const missingRequired: Record<string, unknown>[] = [
  // Missing "event" field
  {
    id: testUUID(500),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    data: { url: 'https://example.com' },
  },

  // Missing "id" field
  {
    event: 'page.view',
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    data: { url: 'https://example.com' },
  },

  // Missing "timestamp" field
  {
    event: 'page.view',
    id: testUUID(502),
    specVersion: '1.0.0',
    data: { url: 'https://example.com' },
  },

  // Missing "specVersion" field
  {
    event: 'page.view',
    id: testUUID(503),
    timestamp: '2024-01-15T10:30:00.000Z',
    data: { url: 'https://example.com' },
  },

  // Purchase event missing "orderId" in data
  {
    event: 'ecommerce.purchase',
    id: testUUID(504),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    data: {
      total: 99.99,
      currency: 'USD',
      products: [],
    },
  },
];
