/**
 * @opendatalayer/adapter-adobe
 *
 * Maps OpenDataLayer events to Adobe Analytics / Adobe Experience Platform.
 *
 * STATUS: Preview — this adapter provides the interface and options structure
 * but does not yet implement event mapping. Community contributions welcome!
 * See: https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/CONTRIBUTING.md
 *
 * Planned mapping logic:
 * - Adobe AppMeasurement (s.tl / s.t) calls
 * - Adobe Experience Platform Web SDK (alloy) integration
 * - eVar/prop mapping from ODL custom dimensions
 * - Product string building from ODL ecommerce data
 * - Adobe Launch / Tags data element integration
 */

export interface AdobeAdapterOptions {
  /** Adobe tracking mode: 'appmeasurement' or 'websdk' (default: 'appmeasurement') */
  mode?: 'appmeasurement' | 'websdk';
  /** Map of ODL event names to Adobe event names */
  eventNameMap?: Record<string, string>;
  /** Map of ODL custom dimensions to Adobe eVars */
  eVarMap?: Record<string, string>;
  /** Map of ODL custom dimensions to Adobe props */
  propMap?: Record<string, string>;
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

export function adobeAdapter(_options: AdobeAdapterOptions = {}): ODLPlugin {
  return {
    name: 'adobe-adapter',

    initialize() {
      // TODO: Validate Adobe Analytics or AEP Web SDK is loaded
    },

    afterEvent(_event: ODLEvent) {
      // This adapter is in preview status.
      // See https://github.com/DataLayerProtocol/OpenDataLayer/issues for progress.
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(
          '[@opendatalayer/adapter-adobe] Preview: event mapping not yet implemented. Event passed through:',
          _event.event,
        );
      }
    },

    destroy() {
      // TODO: Clean up if needed
    },
  };
}

export default adobeAdapter;
