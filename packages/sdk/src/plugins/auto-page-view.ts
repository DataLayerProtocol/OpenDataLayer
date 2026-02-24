import type { DataLayer } from '../core/data-layer.js';
import type { ODLPlugin } from './types.js';

export interface AutoPageViewOptions {
  /** Listen to popstate / pushState for SPA navigation (default: true). */
  trackHistory?: boolean;
  /** Also fire on hash changes (default: false). */
  trackHash?: boolean;
}

/**
 * Plugin that automatically fires `page.view` events.
 *
 * - On initialisation it pushes a `page.view` and sets page context from
 *   `window.location`.
 * - When `trackHistory` is enabled (default) it listens for `popstate` events
 *   and monkey-patches `history.pushState` / `history.replaceState` to detect
 *   SPA navigation, pushing `page.virtual_view`.
 * - When `trackHash` is enabled it additionally listens for `hashchange`.
 * - In non-browser environments (SSR, tests) the plugin is a no-op.
 */
export function autoPageView(options?: AutoPageViewOptions): ODLPlugin {
  const trackHistory = options?.trackHistory ?? true;
  const trackHash = options?.trackHash ?? false;

  // Teardown functions collected during initialisation
  const teardowns: Array<() => void> = [];

  return {
    name: 'auto-page-view',

    initialize(odl: DataLayer): void {
      // Guard: only run in browser environments
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      // Helper: extract page context from current location
      const getPageContext = (): Record<string, unknown> => ({
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        search: window.location.search,
        hash: window.location.hash,
      });

      // Helper: push a virtual page view
      const pushVirtualView = (): void => {
        odl.setContext('page', getPageContext());
        odl.push('page.virtual_view', getPageContext());
      };

      // Initial page view
      odl.setContext('page', getPageContext());
      odl.push('page.view', getPageContext());

      // SPA history tracking
      if (trackHistory) {
        // Listen for back/forward navigation
        const onPopState = (): void => {
          pushVirtualView();
        };
        window.addEventListener('popstate', onPopState);
        teardowns.push(() => window.removeEventListener('popstate', onPopState));

        // Monkey-patch pushState and replaceState so we detect programmatic
        // navigation (e.g. React Router, Vue Router).
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        history.pushState = (...args: Parameters<typeof history.pushState>) => {
          originalPushState(...args);
          pushVirtualView();
        };

        history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
          originalReplaceState(...args);
          pushVirtualView();
        };

        teardowns.push(() => {
          history.pushState = originalPushState;
          history.replaceState = originalReplaceState;
        });
      }

      // Hash change tracking
      if (trackHash) {
        const onHashChange = (): void => {
          pushVirtualView();
        };
        window.addEventListener('hashchange', onHashChange);
        teardowns.push(() => window.removeEventListener('hashchange', onHashChange));
      }
    },

    destroy(): void {
      for (const fn of teardowns) {
        fn();
      }
      teardowns.length = 0;
    },
  };
}
