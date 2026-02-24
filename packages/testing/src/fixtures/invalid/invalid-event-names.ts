/**
 * Invalid event name fixtures for testing event name validation.
 */

export const invalidEventNames: string[] = [
  // Not dot-namespaced (PascalCase, no dot)
  'PageView',

  // Missing action (single segment, no dot)
  'page',

  // Uppercase letters (should be lowercase)
  'Page.View',

  // Starts with number
  '123.test',

  // Empty string
  '',
];
