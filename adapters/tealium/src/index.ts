/**
 * @opendatalayer/adapter-tealium
 *
 * Maps OpenDataLayer events to Tealium iQ / EventStream.
 *
 * STATUS: Preview — this adapter provides the interface and options structure
 * but does not yet implement event mapping. Community contributions welcome!
 * See: https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/CONTRIBUTING.md
 *
 * Planned mapping logic:
 * - utag.link() for non-page-view events
 * - utag.view() for page view events
 * - utag_data population for UDO (Universal Data Object)
 * - Tealium AudienceStream attribute mapping
 * - Event-level data flattening for Tealium's flat key-value model
 * - Ecommerce data mapping to Tealium's ecommerce extensions
 */

export interface TealiumAdapterOptions {
  /** Custom utag reference (default: window.utag) */
  utagInstance?: unknown;
  /** Map of ODL event names to Tealium event names */
  eventNameMap?: Record<string, string>;
  /** Prefix for all data keys pushed to utag (default: none) */
  keyPrefix?: string;
  /** Whether to auto-populate utag_data on page events (default: true) */
  autoPopulateUDO?: boolean;
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

export function tealiumAdapter(_options: TealiumAdapterOptions = {}): ODLPlugin {
  return {
    name: 'tealium-adapter',

    initialize() {
      // TODO: Validate utag is available
    },

    afterEvent(_event: ODLEvent) {
      // TODO: Map ODL events to Tealium utag calls
      // - Page views -> utag.view()
      // - All other events -> utag.link()
      // - Flatten nested data for Tealium's flat UDO model
      // - Map ecommerce data to Tealium ecommerce extensions
      console.warn(
        '[@opendatalayer/adapter-tealium] Not yet implemented. Event ignored:',
        _event.event,
      );
    },

    destroy() {
      // TODO: Clean up if needed
    },
  };
}

export default tealiumAdapter;
