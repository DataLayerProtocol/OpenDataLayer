import type { SemanticRule, ValidationWarning } from '../validator.js';

/**
 * Checks that events include the expected context for their namespace:
 *
 * - page.* events should include context.page
 * - user.* events should include context.user
 */
export const requiredContext: SemanticRule = {
  name: 'required-context',
  description:
    'Warns if page context is missing on page.* events, or if user context is missing on user.* events.',

  validate(event: Record<string, unknown>, context?: Record<string, unknown>): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const eventName = event.event;

    if (typeof eventName !== 'string') {
      return warnings;
    }

    const namespace = eventName.split('.')[0] ?? '';

    // page.* events should have page context
    if (namespace === 'page') {
      const pageContext = context?.page;
      if (!pageContext || typeof pageContext !== 'object') {
        warnings.push({
          rule: 'required-context',
          message: `Event "${eventName}" is a page event but context.page is missing. Page events should include page context (url, title, referrer, etc.).`,
        });
      }
    }

    // user.* events should have user context
    if (namespace === 'user') {
      const userContext = context?.user;
      if (!userContext || typeof userContext !== 'object') {
        warnings.push({
          rule: 'required-context',
          message: `Event "${eventName}" is a user event but context.user is missing. User events should include user context (userId, anonymousId, etc.).`,
        });
      }
    }

    return warnings;
  },
};
