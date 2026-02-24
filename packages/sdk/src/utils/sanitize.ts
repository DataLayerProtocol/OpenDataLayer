/**
 * Default fields considered to be PII (Personally Identifiable Information).
 */
const DEFAULT_PII_FIELDS: readonly string[] = [
  'email',
  'emailAddress',
  'email_address',
  'phone',
  'phoneNumber',
  'phone_number',
  'ssn',
  'socialSecurityNumber',
  'social_security_number',
  'creditCard',
  'credit_card',
  'creditCardNumber',
  'credit_card_number',
  'password',
  'passwd',
  'secret',
  'token',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'dateOfBirth',
  'date_of_birth',
  'dob',
  'address',
  'streetAddress',
  'street_address',
  'ipAddress',
  'ip_address',
];

/**
 * Trim whitespace and truncate a string to `maxLength` characters.
 *
 * @param str - The input string.
 * @param maxLength - Maximum allowed length (default: 1000).
 * @returns The sanitized string.
 */
export function sanitizeString(str: string, maxLength = 1000): string {
  const trimmed = str.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

/**
 * Remove PII fields from a shallow copy of the given object.
 *
 * The comparison is case-insensitive: both the object keys and the PII field
 * list are lower-cased before matching. Nested objects are processed
 * recursively.
 *
 * @param obj - The source object.
 * @param piiFields - Optional list of field names to strip (defaults to a
 *   built-in list covering common PII keys).
 * @returns A new object with matching keys removed.
 */
export function stripPII(
  obj: Record<string, unknown>,
  piiFields?: string[],
): Record<string, unknown> {
  const fields = piiFields ?? (DEFAULT_PII_FIELDS as unknown as string[]);
  const lowerFields = new Set(fields.map((f) => f.toLowerCase()));

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (lowerFields.has(key.toLowerCase())) {
      // Skip PII field
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively strip nested objects
      result[key] = stripPII(value as Record<string, unknown>, piiFields);
    } else {
      result[key] = value;
    }
  }

  return result;
}
