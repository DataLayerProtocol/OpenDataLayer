import type { ValidationResult } from '../validator.js';

/**
 * Serializable representation of a single validation result.
 * Excludes the full event object to keep output concise.
 */
interface JsonValidationOutput {
  event: string;
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: Array<{
    path: string;
    message: string;
    keyword: string;
    params?: Record<string, unknown>;
  }>;
  warnings: Array<{
    rule: string;
    message: string;
  }>;
}

interface JsonBatchOutput {
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
  results: JsonValidationOutput[];
}

/**
 * Format a single ValidationResult as a JSON string.
 */
export function formatJson(result: ValidationResult): string {
  const output: JsonValidationOutput = {
    event: typeof result.event?.event === 'string' ? result.event.event : 'unknown',
    valid: result.valid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errors: result.errors.map((e) => ({
      path: e.path,
      message: e.message,
      keyword: e.keyword,
      ...(e.params ? { params: e.params } : {}),
    })),
    warnings: result.warnings.map((w) => ({
      rule: w.rule,
      message: w.message,
    })),
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Format multiple ValidationResults as a JSON string with summary.
 */
export function formatJsonResults(results: ValidationResult[]): string {
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  const output: JsonBatchOutput = {
    summary: {
      total: results.length,
      passed: results.filter((r) => r.valid).length,
      failed: results.filter((r) => !r.valid).length,
      errors: totalErrors,
      warnings: totalWarnings,
    },
    results: results.map((result) => ({
      event: typeof result.event?.event === 'string' ? result.event.event : 'unknown',
      valid: result.valid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      errors: result.errors.map((e) => ({
        path: e.path,
        message: e.message,
        keyword: e.keyword,
        ...(e.params ? { params: e.params } : {}),
      })),
      warnings: result.warnings.map((w) => ({
        rule: w.rule,
        message: w.message,
      })),
    })),
  };

  return JSON.stringify(output, null, 2);
}
