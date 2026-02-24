/**
 * Valid consent event fixtures for testing.
 */

import { createFullContext, testUUID } from '../../helpers.js';
import type { CapturedEvent } from '../../spy.js';

export const consentEvents: CapturedEvent[] = [
  {
    event: 'consent.given',
    id: testUUID(400),
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      purposes: {
        analytics: true,
        marketing: true,
        functional: true,
        personalization: false,
      },
    },
  },
  {
    event: 'consent.revoked',
    id: testUUID(401),
    timestamp: '2024-01-15T12:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      purposes: {
        analytics: false,
        marketing: false,
        functional: true,
        personalization: false,
      },
    },
  },
  {
    event: 'consent.preferences_updated',
    id: testUUID(402),
    timestamp: '2024-01-15T14:00:00.000Z',
    specVersion: '1.0.0',
    context: createFullContext(),
    data: {
      purposes: {
        analytics: true,
        marketing: false,
        functional: true,
        personalization: true,
      },
      previousPurposes: {
        analytics: true,
        marketing: true,
        functional: true,
        personalization: false,
      },
    },
  },
];
