/**
 * Invalid event fixtures - wrong field types.
 * These are intentionally invalid and typed loosely for testing validation.
 */

import { testUUID } from '../../helpers.js';

export const invalidTypes: Record<string, unknown>[] = [
  // "event" field as number instead of string
  {
    event: 42,
    id: testUUID(600),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
  },

  // "timestamp" as number instead of string
  {
    event: 'page.view',
    id: testUUID(601),
    timestamp: 1705312200000,
    specVersion: '1.0.0',
  },

  // "data" as string instead of object
  {
    event: 'page.view',
    id: testUUID(602),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    data: 'not an object',
  },

  // "specVersion" as wrong version
  {
    event: 'page.view',
    id: testUUID(603),
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '2.0.0',
  },
];
