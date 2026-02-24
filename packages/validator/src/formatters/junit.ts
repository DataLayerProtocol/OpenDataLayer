import type { ValidationResult } from '../validator.js';

/**
 * Escape special XML characters in a string.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a single ValidationResult as a JUnit XML test case.
 */
function formatTestCase(result: ValidationResult): string {
  const eventName = typeof result.event?.event === 'string' ? result.event.event : 'unknown';

  const lines: string[] = [];

  if (result.valid && result.warnings.length === 0) {
    // Passing test case
    lines.push(`    <testcase name="${escapeXml(eventName)}" classname="odl.validation" />`);
  } else {
    lines.push(`    <testcase name="${escapeXml(eventName)}" classname="odl.validation">`);

    // Add failures for errors
    for (const error of result.errors) {
      lines.push(
        `      <failure type="${escapeXml(error.keyword)}" message="${escapeXml(error.message)}">`,
      );
      lines.push(`path: ${escapeXml(error.path)}`);
      lines.push(`keyword: ${escapeXml(error.keyword)}`);
      if (error.params) {
        lines.push(`params: ${escapeXml(JSON.stringify(error.params))}`);
      }
      lines.push('      </failure>');
    }

    // Add system-out for warnings (JUnit convention)
    if (result.warnings.length > 0) {
      lines.push('      <system-out>');
      for (const warning of result.warnings) {
        lines.push(`[${escapeXml(warning.rule)}] ${escapeXml(warning.message)}`);
      }
      lines.push('      </system-out>');
    }

    lines.push('    </testcase>');
  }

  return lines.join('\n');
}

/**
 * Format a single ValidationResult as JUnit XML.
 */
export function formatJunit(result: ValidationResult): string {
  return formatJunitResults([result]);
}

/**
 * Format multiple ValidationResults as a complete JUnit XML report.
 */
export function formatJunitResults(results: ValidationResult[]): string {
  const totalTests = results.length;
  const failures = results.filter((r) => !r.valid).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<testsuites tests="${totalTests}" failures="${failures}" errors="${totalErrors}">`);
  lines.push(
    `  <testsuite name="OpenDataLayer Validation" tests="${totalTests}" failures="${failures}" errors="${totalErrors}">`,
  );

  for (const result of results) {
    lines.push(formatTestCase(result));
  }

  lines.push('  </testsuite>');
  lines.push('</testsuites>');

  return lines.join('\n');
}
