import type { ValidationResult } from '../validator.js';
import { formatConsole, formatConsoleResults } from './console.js';
import { formatJson, formatJsonResults } from './json.js';
import { formatJunit, formatJunitResults } from './junit.js';

export { formatConsole, formatConsoleResults } from './console.js';
export { formatJson, formatJsonResults } from './json.js';
export { formatJunit, formatJunitResults } from './junit.js';

export type OutputFormat = 'console' | 'json' | 'junit';

/**
 * Format a single validation result using the specified format.
 */
export function format(result: ValidationResult, outputFormat: OutputFormat): string {
  switch (outputFormat) {
    case 'console':
      return formatConsole(result);
    case 'json':
      return formatJson(result);
    case 'junit':
      return formatJunit(result);
    default:
      throw new Error(`Unknown output format: ${outputFormat as string}`);
  }
}

/**
 * Format multiple validation results using the specified format.
 */
export function formatResults(results: ValidationResult[], outputFormat: OutputFormat): string {
  switch (outputFormat) {
    case 'console':
      return formatConsoleResults(results);
    case 'json':
      return formatJsonResults(results);
    case 'junit':
      return formatJunitResults(results);
    default:
      throw new Error(`Unknown output format: ${outputFormat as string}`);
  }
}
