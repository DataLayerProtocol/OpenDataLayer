/**
 * @opendatalayer/adapter-amplitude
 *
 * Maps OpenDataLayer events to Amplitude Analytics SDK.
 *
 * STATUS: Preview — this adapter provides the interface and options structure
 * but does not yet implement event mapping. Community contributions welcome!
 * See: https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/CONTRIBUTING.md
 *
 * Planned mapping logic:
 * - amplitude.track() for all track events
 * - amplitude.identify() for user identification
 * - amplitude.setGroup() for group analytics
 * - amplitude.revenue() for ecommerce/revenue events
 * - User property mapping from ODL context
 * - Event property flattening and type coercion
 */

export interface AmplitudeAdapterOptions {
  /** Custom Amplitude instance (default: window.amplitude) */
  amplitudeInstance?: unknown;
  /** Map of ODL event names to custom Amplitude event names */
  eventNameMap?: Record<string, string>;
  /** Whether to automatically set user properties from ODL context (default: true) */
  autoSetUserProperties?: boolean;
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

export function amplitudeAdapter(_options: AmplitudeAdapterOptions = {}): ODLPlugin {
  return {
    name: 'amplitude-adapter',

    initialize() {
      // TODO: Validate Amplitude SDK is loaded
    },

    afterEvent(_event: ODLEvent) {
      // TODO: Map ODL events to Amplitude SDK calls
      // - User identification -> amplitude.identify()
      // - Ecommerce -> amplitude.revenue()
      // - All events -> amplitude.track()
      // - User context -> user properties
      console.warn(
        '[@opendatalayer/adapter-amplitude] Not yet implemented. Event ignored:',
        _event.event,
      );
    },

    destroy() {
      // TODO: Clean up if needed
    },
  };
}

export default amplitudeAdapter;
