import type { ValidationResult } from '../validator.js';

// ANSI color codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

/**
 * Format a single ValidationResult for terminal output with ANSI colors.
 */
export function formatConsole(result: ValidationResult): string {
  const lines: string[] = [];

  // Event header
  const eventName = typeof result.event?.event === 'string' ? result.event.event : 'unknown event';

  if (result.valid && result.warnings.length === 0) {
    lines.push(`${GREEN}${BOLD}PASS${RESET} ${eventName}`);
  } else if (result.valid && result.warnings.length > 0) {
    lines.push(
      `${YELLOW}${BOLD}WARN${RESET} ${eventName} ${DIM}(${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})${RESET}`,
    );
  } else {
    lines.push(
      `${RED}${BOLD}FAIL${RESET} ${eventName} ${DIM}(${result.errors.length} error${result.errors.length === 1 ? '' : 's'})${RESET}`,
    );
  }

  // Errors
  for (const error of result.errors) {
    lines.push(`  ${RED}error${RESET} ${CYAN}${error.path}${RESET}: ${error.message}`);
    if (error.keyword) {
      lines.push(`         ${DIM}keyword: ${error.keyword}${RESET}`);
    }
  }

  // Warnings
  for (const warning of result.warnings) {
    lines.push(`  ${YELLOW}warn${RESET}  ${DIM}[${warning.rule}]${RESET} ${warning.message}`);
  }

  return lines.join('\n');
}

/**
 * Format multiple ValidationResults for terminal output.
 */
export function formatConsoleResults(results: ValidationResult[]): string {
  const sections: string[] = [];

  for (const result of results) {
    sections.push(formatConsole(result));
  }

  // Summary
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const passed = results.filter((r) => r.valid).length;
  const failed = results.filter((r) => !r.valid).length;

  sections.push('');
  sections.push(
    `${BOLD}Results:${RESET} ${results.length} event${results.length === 1 ? '' : 's'} validated`,
  );

  const summaryParts: string[] = [];
  if (passed > 0) {
    summaryParts.push(`${GREEN}${passed} passed${RESET}`);
  }
  if (failed > 0) {
    summaryParts.push(`${RED}${failed} failed${RESET}`);
  }
  if (totalErrors > 0) {
    summaryParts.push(`${RED}${totalErrors} error${totalErrors === 1 ? '' : 's'}${RESET}`);
  }
  if (totalWarnings > 0) {
    summaryParts.push(`${YELLOW}${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}${RESET}`);
  }

  if (summaryParts.length > 0) {
    sections.push(`         ${summaryParts.join(', ')}`);
  }

  return sections.join('\n');
}
