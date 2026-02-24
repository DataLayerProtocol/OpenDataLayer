import type { SemanticRule, ValidationWarning } from '../validator.js';

/**
 * Namespaces considered "tracking" events that should require consent.
 */
const TRACKING_NAMESPACES = [
  'ecommerce',
  'user',
  'interaction',
  'media',
  'search',
  'performance',
  'form',
];

/**
 * Warns if a tracking event is fired without consent context
 * or with consent.status !== "granted".
 *
 * Consent-related events themselves (consent.*) are exempt since
 * they may legitimately fire before consent is granted.
 */
export const consentBeforeTracking: SemanticRule = {
  name: 'consent-before-tracking',
  description:
    'Warns if a tracking event is fired without consent context or without consent.status === "granted".',

  validate(event: Record<string, unknown>, context?: Record<string, unknown>): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const eventName = event.event;

    if (typeof eventName !== 'string') {
      return warnings;
    }

    // Extract the top-level namespace (e.g., "ecommerce" from "ecommerce.purchase")
    const namespace = eventName.split('.')[0] ?? '';

    // Skip non-tracking events and consent events themselves
    if (!TRACKING_NAMESPACES.includes(namespace)) {
      return warnings;
    }

    // Check for consent context
    const consent = context?.consent as Record<string, unknown> | undefined;

    if (!consent) {
      warnings.push({
        rule: 'consent-before-tracking',
        message: `Tracking event "${eventName}" fired without consent context. Include context.consent to indicate the user\'s consent state.`,
      });
      return warnings;
    }

    // Check consent status
    const status = consent.status;
    if (status !== 'granted') {
      warnings.push({
        rule: 'consent-before-tracking',
        message: `Tracking event "${eventName}" fired with consent.status="${String(status ?? 'undefined')}". Expected consent.status to be "granted" before firing tracking events.`,
      });
    }

    return warnings;
  },
};
