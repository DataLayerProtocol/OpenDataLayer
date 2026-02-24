export {
  ODLValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidatorOptions,
  type SemanticRule,
} from './validator.js';

export { SchemaRegistry, type SchemaEntry } from './schema-registry.js';

export { defaultRules } from './rules/index.js';
export { consentBeforeTracking } from './rules/consent-before-tracking.js';
export { ecommerceConsistency } from './rules/ecommerce-consistency.js';
export { requiredContext } from './rules/required-context.js';

export {
  format,
  formatResults,
  formatConsole,
  formatConsoleResults,
  formatJson,
  formatJsonResults,
  formatJunit,
  formatJunitResults,
  type OutputFormat,
} from './formatters/index.js';
