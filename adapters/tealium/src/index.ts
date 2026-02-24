/**
 * @opendatalayer/adapter-tealium
 *
 * Maps OpenDataLayer events to Tealium iQ / EventStream.
 * Routes events to utag.view() for page events and utag.link() for all others.
 * Flattens nested ODL data into Tealium's flat key-value UDO model where all
 * values are strings. Maps ecommerce data to Tealium's array-of-strings convention.
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

/** Minimal Tealium utag interface */
interface UtagInstance {
  view(data: Record<string, string>): void;
  link(data: Record<string, string>): void;
}

declare global {
  interface Window {
    utag?: UtagInstance;
    utag_data?: Record<string, string>;
  }
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

/** Default ODL -> Tealium event name mappings */
const DEFAULT_EVENT_MAP: Record<string, string> = {
  'page.view': 'page_view',
  'page.virtual_view': 'virtual_page_view',
  'ecommerce.product_viewed': 'product_view',
  'ecommerce.product_added': 'cart_add',
  'ecommerce.product_removed': 'cart_remove',
  'ecommerce.purchase': 'purchase',
  'ecommerce.checkout_started': 'checkout',
  'user.signed_up': 'user_registration',
  'user.signed_in': 'user_login',
  'search.performed': 'search',
};

/** Flatten a nested object into dot-free underscore-delimited keys with all string values */
function flattenToStrings(obj: Record<string, unknown>, prefix: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenToStrings(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

/** Apply a key prefix to all entries in a record */
function applyPrefix(
  data: Record<string, string>,
  prefix: string | undefined,
): Record<string, string> {
  if (!prefix) return data;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[`${prefix}_${key}`] = value;
  }
  return result;
}

/**
 * Map ecommerce product arrays to Tealium's array-of-strings convention.
 *
 * Tealium represents product lists as parallel arrays of strings:
 *   product_id: ["SKU1", "SKU2"]
 *   product_name: ["Widget", "Gadget"]
 *   product_price: ["9.99", "19.99"]
 */
function mapEcommerceProducts(products: Record<string, unknown>[]): Record<string, string> {
  const ids: string[] = [];
  const names: string[] = [];
  const prices: string[] = [];
  const quantities: string[] = [];
  const brands: string[] = [];
  const categories: string[] = [];

  for (const product of products) {
    ids.push(String(product.id ?? ''));
    names.push(String(product.name ?? ''));
    prices.push(String(product.price ?? ''));
    quantities.push(String(product.quantity ?? '1'));
    brands.push(String(product.brand ?? ''));
    categories.push(String(product.category ?? ''));
  }

  return {
    product_id: ids.join(','),
    product_name: names.join(','),
    product_price: prices.join(','),
    product_quantity: quantities.join(','),
    product_brand: brands.join(','),
    product_category: categories.join(','),
  };
}

/** Map ODL ecommerce order-level data to Tealium order fields */
function mapOrderData(data: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  if (data.orderId !== undefined) result.order_id = String(data.orderId);
  if (data.total !== undefined) result.order_total = String(data.total);
  if (data.revenue !== undefined) result.order_total = String(data.revenue);
  if (data.currency !== undefined) result.order_currency = String(data.currency);
  if (data.tax !== undefined) result.order_tax = String(data.tax);
  if (data.shipping !== undefined) result.order_shipping = String(data.shipping);

  return result;
}

/** Build the full Tealium data payload from an ODL event */
function buildTealiumData(
  event: ODLEvent,
  tealiumEventName: string,
  keyPrefix: string | undefined,
): Record<string, string> {
  let payload: Record<string, string> = {};

  // Flatten event data
  if (event.data) {
    const isEcommerce = event.event.startsWith('ecommerce.');

    if (isEcommerce) {
      // Map products to Tealium array convention
      if (event.data.products && Array.isArray(event.data.products)) {
        Object.assign(
          payload,
          mapEcommerceProducts(event.data.products as Record<string, unknown>[]),
        );
      }
      if (event.data.product && typeof event.data.product === 'object') {
        Object.assign(
          payload,
          mapEcommerceProducts([event.data.product as Record<string, unknown>]),
        );
      }

      // Map order-level data
      Object.assign(payload, mapOrderData(event.data));

      // Flatten remaining data fields (skip products/product to avoid duplication)
      const remaining: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(event.data)) {
        if (key !== 'products' && key !== 'product') {
          remaining[key] = value;
        }
      }
      // Order fields are already mapped above; flatten everything else
      const flatRemaining = flattenToStrings(remaining, '');
      // Do not overwrite already-mapped order/product keys
      for (const [key, value] of Object.entries(flatRemaining)) {
        if (!(key in payload)) {
          payload[key] = value;
        }
      }
    } else {
      Object.assign(payload, flattenToStrings(event.data, ''));
    }
  }

  // Include custom dimensions as flat string values
  if (event.customDimensions) {
    for (const [key, value] of Object.entries(event.customDimensions)) {
      payload[key] = String(value);
    }
  }

  // Include ODL metadata
  payload.tealium_event = tealiumEventName;
  payload.odl_event_id = event.id;
  payload.odl_timestamp = event.timestamp;

  // Apply key prefix
  payload = applyPrefix(payload, keyPrefix);

  return payload;
}

export function tealiumAdapter(options: TealiumAdapterOptions = {}): ODLPlugin {
  const { utagInstance, eventNameMap = {}, keyPrefix, autoPopulateUDO = true } = options;

  const mergedEventMap = { ...DEFAULT_EVENT_MAP, ...eventNameMap };

  function getUtag(): UtagInstance | undefined {
    if (utagInstance) return utagInstance as UtagInstance;
    if (typeof window !== 'undefined') return window.utag;
    return undefined;
  }

  return {
    name: 'tealium-adapter',

    initialize() {
      const utag = getUtag();
      if (!utag && typeof window !== 'undefined') {
        console.warn(
          '[@opendatalayer/adapter-tealium] utag not found. ' +
            'Make sure Tealium iQ is loaded before initializing the adapter.',
        );
      }
    },

    afterEvent(event: ODLEvent) {
      const utag = getUtag();
      if (!utag) return;

      const tealiumEventName = mergedEventMap[event.event] ?? event.event.replace(/\./g, '_');

      const isPageEvent = event.event === 'page.view' || event.event === 'page.virtual_view';

      const data = buildTealiumData(event, tealiumEventName, keyPrefix);

      if (isPageEvent) {
        // Auto-populate window.utag_data for page events
        if (autoPopulateUDO && typeof window !== 'undefined') {
          window.utag_data = { ...data };
        }
        utag.view(data);
      } else {
        utag.link(data);
      }
    },

    destroy() {
      // Nothing to clean up
    },
  };
}

export default tealiumAdapter;
