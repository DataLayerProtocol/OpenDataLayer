/**
 * Valid page event fixtures for testing.
 */

import { createPageContext, testUUID } from '../../helpers.js';
import type { CapturedEvent } from '../../spy.js';

export const pageEvents: CapturedEvent[] = [
  {
    event: 'page.view',
    id: testUUID(100),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    context: {
      page: createPageContext(),
    },
    data: {
      url: 'https://example.com/products/widget',
      path: '/products/widget',
      title: 'Widget - Example Store',
      referrer: 'https://example.com/',
    },
  },
  {
    event: 'page.leave',
    id: testUUID(101),
    timestamp: '2024-01-15T10:35:00.000Z',
    specVersion: '1.0.0',
    context: {
      page: createPageContext(),
    },
    data: {
      url: 'https://example.com/products/widget',
      path: '/products/widget',
      dwellTimeMs: 300000,
      scrollDepthPercent: 75,
      scrollDepthPixels: 2400,
    },
  },
  {
    event: 'page.virtual_view',
    id: testUUID(102),
    timestamp: '2024-01-15T10:36:00.000Z',
    specVersion: '1.0.0',
    context: {
      page: createPageContext({
        url: 'https://example.com/products/gadget',
        path: '/products/gadget',
        title: 'Gadget - Example Store',
      }),
    },
    data: {
      url: 'https://example.com/products/gadget',
      path: '/products/gadget',
      previousUrl: 'https://example.com/products/widget',
    },
  },
];
