/**
 * Valid user event fixtures for testing.
 */

import { createFullContext, createUserContext, testUUID } from '../../helpers.js';
import type { CapturedEvent } from '../../spy.js';

export const userEvents: CapturedEvent[] = [
  {
    event: 'user.signed_up',
    id: testUUID(300),
    timestamp: '2024-01-15T09:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext({
      user: createUserContext({ isAuthenticated: false }),
    }),
    data: {
      method: 'email',
    },
  },
  {
    event: 'user.signed_in',
    id: testUUID(301),
    timestamp: '2024-01-15T09:05:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      method: 'google_oauth',
    },
  },
  {
    event: 'user.signed_out',
    id: testUUID(302),
    timestamp: '2024-01-15T18:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext({
      user: createUserContext({ isAuthenticated: false }),
    }),
    data: {},
  },
  {
    event: 'user.identified',
    id: testUUID(303),
    timestamp: '2024-01-15T09:06:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      userId: 'user-12345',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        plan: 'premium',
        createdAt: '2023-06-15T00:00:00.000Z',
      },
    },
  },
];
