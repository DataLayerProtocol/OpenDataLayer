/**
 * @opendatalayer/adapter-piwik
 *
 * Maps OpenDataLayer events to Piwik PRO / Matomo tracking API.
 *
 * STATUS: Preview — this adapter provides the interface and options structure
 * but does not yet implement event mapping. Community contributions welcome!
 * See: https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/CONTRIBUTING.md
 *
 * Planned mapping logic:
 * - _paq.push(['trackPageView']) for page views
 * - _paq.push(['trackEvent', ...]) for custom events
 * - _paq.push(['trackSiteSearch', ...]) for search events
 * - _paq.push(['setEcommerceView', ...]) for product views
 * - _paq.push(['addEcommerceItem', ...]) for cart operations
 * - _paq.push(['trackEcommerceOrder', ...]) for purchases
 * - Custom dimension mapping via _paq.push(['setCustomDimension', ...])
 * - User ID setting via _paq.push(['setUserId', ...])
 */

export interface PiwikAdapterOptions {
  /** Custom _paq array reference */
  paqInstance?: unknown[];
  /** Map of ODL event names to Piwik event categories */
  eventCategoryMap?: Record<string, string>;
  /** Map of ODL custom dimensions to Piwik custom dimension IDs */
  customDimensionMap?: Record<string, number>;
}

// ODL event interface (minimal, to avoid SDK dependency)
interface ODLEvent {
  event: string;
  id: string;
  timestamp: string;
  specVersion: string;
  context?: Record<string, unknown>;
  data?: Record<string, unknown>;
  customDimensions?: Record<string, string | number | boolean>;
}

// Plugin interface (to avoid SDK dependency)
interface ODLPlugin {
  name: string;
  initialize?(odl: unknown): void;
  afterEvent?(event: ODLEvent): void;
  destroy?(): void;
}

export function piwikAdapter(_options: PiwikAdapterOptions = {}): ODLPlugin {
  return {
    name: 'piwik-adapter',

    initialize() {
      // TODO: Validate _paq is available
    },

    afterEvent(_event: ODLEvent) {
      // TODO: Map ODL events to Piwik/Matomo _paq calls
      // - Page views -> trackPageView
      // - Custom events -> trackEvent
      // - Search -> trackSiteSearch
      // - Ecommerce -> ecommerce tracking methods
      // - Custom dimensions -> setCustomDimension
      console.warn(
        '[@opendatalayer/adapter-piwik] Not yet implemented. Event ignored:',
        _event.event,
      );
    },

    destroy() {
      // TODO: Clean up if needed
    },
  };
}

export default piwikAdapter;
