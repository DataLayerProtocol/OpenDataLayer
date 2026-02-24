import { deepMerge } from '../utils/deep-merge.js';
import { sanitizeString, stripPII } from '../utils/sanitize.js';
import { now } from '../utils/timestamp.js';
import { generateUUID } from '../utils/uuid.js';

// =============================================================================
// generateUUID
// =============================================================================

describe('generateUUID', () => {
  it('returns a string in UUID v4 format', () => {
    const uuid = generateUUID();

    // UUID v4 pattern: 8-4-4-4-12 hex digits with version 4 and variant bits
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('returns unique values across multiple calls', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }

    expect(uuids.size).toBe(100);
  });

  it('returns a 36-character string (including dashes)', () => {
    const uuid = generateUUID();
    expect(uuid).toHaveLength(36);
  });
});

// =============================================================================
// now
// =============================================================================

describe('now', () => {
  it('returns an ISO 8601 string', () => {
    const result = now();

    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns a valid parseable date', () => {
    const result = now();
    const parsed = new Date(result);

    expect(parsed.toISOString()).toBe(result);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  it('returns a timestamp close to the current time', () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();

    const ts = new Date(result).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// =============================================================================
// deepMerge
// =============================================================================

describe('deepMerge', () => {
  it('merges plain objects recursively', () => {
    const target = { a: 1, nested: { x: 10, y: 20 } };
    const source = { b: 2, nested: { y: 99, z: 30 } };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: 2,
      nested: { x: 10, y: 99, z: 30 },
    });
  });

  it('arrays replace, not concatenate', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };

    const result = deepMerge(target, source);

    expect(result.items).toEqual([4, 5]);
  });

  it('does not mutate the target', () => {
    const target = { a: 1, nested: { x: 10 } };
    const source = { a: 2, nested: { y: 20 } };

    const targetCopy = JSON.parse(JSON.stringify(target));
    deepMerge(target, source);

    expect(target).toEqual(targetCopy);
  });

  it('handles multiple sources', () => {
    const target = { a: 1 };
    const source1 = { b: 2 };
    const source2 = { c: 3 };

    const result = deepMerge(target, source1, source2);

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('later sources override earlier ones', () => {
    const target = { a: 1 };
    const source1 = { a: 2 };
    const source2 = { a: 3 };

    const result = deepMerge(target, source1, source2);

    expect(result.a).toBe(3);
  });

  it('returns target when no sources provided', () => {
    const target = { a: 1 };
    const result = deepMerge(target);

    expect(result).toBe(target);
  });

  it('handles null and undefined source values', () => {
    const target = { a: 1, b: 'hello' };
    const source = { a: null, b: undefined } as Partial<typeof target>;

    const result = deepMerge(target, source);

    expect(result.a).toBeNull();
    expect(result.b).toBeUndefined();
  });

  it('skips null/undefined sources entirely', () => {
    const target = { a: 1 };
    const result = deepMerge(target, null as unknown as Partial<typeof target>);

    expect(result).toEqual({ a: 1 });
  });

  it('handles deeply nested merges', () => {
    const target = { l1: { l2: { l3: { a: 1 } } } };
    const source = { l1: { l2: { l3: { b: 2 } } } };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      l1: { l2: { l3: { a: 1, b: 2 } } },
    });
  });

  it('non-plain-object values are assigned by reference', () => {
    const date = new Date('2024-01-01');
    const target = { date: new Date('2023-01-01') };
    const source = { date };

    const result = deepMerge(target, source);

    expect(result.date).toBe(date);
  });
});

// =============================================================================
// sanitizeString
// =============================================================================

describe('sanitizeString', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('trims tabs and newlines', () => {
    expect(sanitizeString('\thello\n')).toBe('hello');
  });

  it('truncates at maxLength', () => {
    const result = sanitizeString('abcdefghij', 5);
    expect(result).toBe('abcde');
    expect(result).toHaveLength(5);
  });

  it('trims before truncating', () => {
    // " abc " -> "abc" (length 3), which is within maxLength 5
    expect(sanitizeString('  abc  ', 5)).toBe('abc');
  });

  it('uses default maxLength of 1000', () => {
    const longString = 'a'.repeat(1500);
    const result = sanitizeString(longString);

    expect(result).toHaveLength(1000);
  });

  it('returns the string as-is if within maxLength', () => {
    expect(sanitizeString('short', 100)).toBe('short');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('handles string that is only whitespace', () => {
    expect(sanitizeString('   ')).toBe('');
  });
});

// =============================================================================
// stripPII
// =============================================================================

describe('stripPII', () => {
  it('removes default PII fields', () => {
    const input = {
      id: '42',
      email: 'alice@example.com',
      phone: '555-1234',
      name: 'item-name',
    };

    const result = stripPII(input);

    expect(result).toEqual({ id: '42', name: 'item-name' });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
  });

  it('is case-insensitive', () => {
    const input = {
      Email: 'alice@example.com',
      EMAIL: 'alice@example.com',
      PhoneNumber: '555-1234',
      PASSWORD: 'secret123',
      SSN: '123-45-6789',
    };

    const result = stripPII(input);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('strips PII recursively in nested objects', () => {
    const input = {
      id: '42',
      profile: {
        displayName: 'Alice',
        email: 'alice@example.com',
        details: {
          phone: '555-1234',
          city: 'Portland',
        },
      },
    };

    const result = stripPII(input);

    expect(result).toEqual({
      id: '42',
      profile: {
        displayName: 'Alice',
        details: {
          city: 'Portland',
        },
      },
    });
  });

  it('does not modify the original object', () => {
    const input = {
      id: '42',
      email: 'alice@example.com',
    };

    const inputCopy = { ...input };
    stripPII(input);

    expect(input).toEqual(inputCopy);
  });

  it('handles custom PII fields', () => {
    const input = {
      username: 'alice',
      internalId: '12345',
      publicName: 'Alice',
    };

    const result = stripPII(input, ['username', 'internalId']);

    expect(result).toEqual({ publicName: 'Alice' });
  });

  it('removes common PII fields from the default list', () => {
    const input: Record<string, unknown> = {
      keepMe: 'safe',
      firstName: 'Alice',
      lastName: 'Smith',
      fullName: 'Alice Smith',
      first_name: 'Alice',
      last_name: 'Smith',
      full_name: 'Alice Smith',
      emailAddress: 'a@b.com',
      email_address: 'a@b.com',
      phoneNumber: '555',
      phone_number: '555',
      ssn: '123',
      socialSecurityNumber: '123',
      social_security_number: '123',
      creditCard: '4111',
      credit_card: '4111',
      creditCardNumber: '4111',
      credit_card_number: '4111',
      password: 'pass',
      passwd: 'pass',
      secret: 'shhh',
      token: 'tok',
      dateOfBirth: '1990-01-01',
      date_of_birth: '1990-01-01',
      dob: '1990-01-01',
      address: '123 Main St',
      streetAddress: '123 Main St',
      street_address: '123 Main St',
      ipAddress: '127.0.0.1',
      ip_address: '127.0.0.1',
    };

    const result = stripPII(input);

    expect(Object.keys(result)).toEqual(['keepMe']);
    expect(result.keepMe).toBe('safe');
  });

  it('leaves arrays as-is (no recursion into arrays)', () => {
    const input = {
      tags: ['email', 'phone'],
      value: 'keep',
    };

    const result = stripPII(input);

    expect(result.tags).toEqual(['email', 'phone']);
    expect(result.value).toBe('keep');
  });

  it('handles empty object', () => {
    expect(stripPII({})).toEqual({});
  });

  it('preserves non-PII fields', () => {
    const input = {
      productId: 'SKU-123',
      category: 'electronics',
      price: 99.99,
      inStock: true,
    };

    const result = stripPII(input);

    expect(result).toEqual(input);
  });
});
