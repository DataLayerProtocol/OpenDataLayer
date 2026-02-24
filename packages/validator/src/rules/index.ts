import type { SemanticRule } from '../validator.js';
import { consentBeforeTracking } from './consent-before-tracking.js';
import { ecommerceConsistency } from './ecommerce-consistency.js';
import { requiredContext } from './required-context.js';

export { consentBeforeTracking } from './consent-before-tracking.js';
export { ecommerceConsistency } from './ecommerce-consistency.js';
export { requiredContext } from './required-context.js';

/** All built-in semantic rules */
export const defaultRules: SemanticRule[] = [
  consentBeforeTracking,
  ecommerceConsistency,
  requiredContext,
];
