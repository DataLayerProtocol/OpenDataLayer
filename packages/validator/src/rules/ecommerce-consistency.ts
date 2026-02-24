import type { SemanticRule, ValidationWarning } from '../validator.js';

/**
 * Checks ecommerce events for data consistency:
 *
 * 1. Warns if any monetary value (total, revenue, tax, shipping, discount, price)
 *    is present in data but no currency is specified.
 * 2. Warns if ecommerce.purchase events have an empty products array.
 * 3. Warns if product items have a price but no currency at the event level.
 */
export const ecommerceConsistency: SemanticRule = {
  name: 'ecommerce-consistency',
  description:
    'Warns on ecommerce data inconsistencies: missing currency when prices are present, empty products on purchase events.',

  validate(
    event: Record<string, unknown>,
    _context?: Record<string, unknown>,
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const eventName = event.event;

    if (typeof eventName !== 'string') {
      return warnings;
    }

    // Only apply to ecommerce events
    if (!eventName.startsWith('ecommerce.')) {
      return warnings;
    }

    const data = event.data as Record<string, unknown> | undefined;
    if (!data) {
      return warnings;
    }

    // Check for monetary fields without currency
    const monetaryFields = ['total', 'revenue', 'tax', 'shipping', 'discount', 'price'];
    const hasMonetaryValue = monetaryFields.some((field) => typeof data[field] === 'number');
    const hasCurrency = typeof data.currency === 'string' && data.currency !== '';

    if (hasMonetaryValue && !hasCurrency) {
      const presentFields = monetaryFields.filter((field) => typeof data[field] === 'number');
      warnings.push({
        rule: 'ecommerce-consistency',
        message: `Event "${eventName}" has monetary value(s) (${presentFields.join(', ')}) but no currency specified. Add a "currency" field (e.g., "USD") to data.`,
      });
    }

    // Check for empty products array on purchase events
    if (eventName === 'ecommerce.purchase') {
      const products = data.products;
      if (Array.isArray(products) && products.length === 0) {
        warnings.push({
          rule: 'ecommerce-consistency',
          message:
            'Event "ecommerce.purchase" has an empty products array. ' +
            'Purchase events should include at least one product.',
        });
      }
    }

    // Check products for price without currency at event level
    const products = data.products;
    if (Array.isArray(products) && products.length > 0) {
      const hasProductPrice = products.some(
        (p: unknown) =>
          typeof p === 'object' &&
          p !== null &&
          typeof (p as Record<string, unknown>).price === 'number',
      );

      if (hasProductPrice && !hasCurrency) {
        warnings.push({
          rule: 'ecommerce-consistency',
          message: `Event "${eventName}" has products with prices but no currency specified at the event level. Add a "currency" field to the event data.`,
        });
      }
    }

    return warnings;
  },
};
