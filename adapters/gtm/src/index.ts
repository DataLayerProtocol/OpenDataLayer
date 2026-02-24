/**
 * @opendatalayer/adapter-gtm
 *
 * Maps OpenDataLayer events to Google Tag Manager's dataLayer format.
 * Pushes events to window.dataLayer for GTM consumption.
 */

export interface GTMAdapterOptions {
  /** Custom dataLayer variable name (default: 'dataLayer') */
  dataLayerName?: string;
  /** Map of ODL event names to custom GTM event names */
  eventNameMap?: Record<string, string>;
  /** Whether to include full context in dataLayer push (default: false) */
  includeContext?: boolean;
  /** Whether to flatten nested objects (default: true) */
  flattenData?: boolean;
}

interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    [key: string]: unknown;
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

/** Default ODL -> GTM event name mappings */
const DEFAULT_EVENT_MAP: Record<string, string> = {
  'page.view': 'page_view',
  'page.virtual_view': 'virtual_page_view',
  'ecommerce.product_viewed': 'view_item',
  'ecommerce.product_list_viewed': 'view_item_list',
  'ecommerce.product_clicked': 'select_item',
  'ecommerce.product_added': 'add_to_cart',
  'ecommerce.product_removed': 'remove_from_cart',
  'ecommerce.cart_viewed': 'view_cart',
  'ecommerce.checkout_started': 'begin_checkout',
  'ecommerce.checkout_step_completed': 'checkout_progress',
  'ecommerce.payment_info_entered': 'add_payment_info',
  'ecommerce.purchase': 'purchase',
  'ecommerce.refund': 'refund',
  'ecommerce.promotion_viewed': 'view_promotion',
  'ecommerce.promotion_clicked': 'select_promotion',
  'user.signed_up': 'sign_up',
  'user.signed_in': 'login',
  'search.performed': 'search',
  'interaction.share': 'share',
  'interaction.file_downloaded': 'file_download',
};

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/** Map ODL product to GA4 item format */
function mapProduct(product: Record<string, unknown>): Record<string, unknown> {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_category: product.category,
    item_variant: product.variant,
    price: product.price,
    quantity: product.quantity ?? 1,
    coupon: product.coupon,
    discount: product.discount,
    index: product.position,
  };
}

/** Map ODL ecommerce event data to GA4 ecommerce format */
function mapEcommerceData(
  _eventName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Map products to items
  if (data.products && Array.isArray(data.products)) {
    result.items = (data.products as Record<string, unknown>[]).map(mapProduct);
  }
  if (data.product && typeof data.product === 'object') {
    result.items = [mapProduct(data.product as Record<string, unknown>)];
  }

  // Map common ecommerce fields
  if (data.orderId) result.transaction_id = data.orderId;
  if (data.total !== undefined) result.value = data.total;
  if (data.revenue !== undefined) result.value = data.revenue;
  if (data.currency) result.currency = data.currency;
  if (data.tax !== undefined) result.tax = data.tax;
  if (data.shipping !== undefined) result.shipping = data.shipping;
  if (data.coupon) result.coupon = data.coupon;

  // Map list fields
  if (data.listId) result.item_list_id = data.listId;
  if (data.listName) result.item_list_name = data.listName;

  // Map promotion
  if (data.promotion && typeof data.promotion === 'object') {
    const promo = data.promotion as Record<string, unknown>;
    result.items = [
      {
        promotion_id: promo.id,
        promotion_name: promo.name,
        creative_name: promo.creative,
        creative_slot: promo.position,
      },
    ];
  }

  return result;
}

export function gtmAdapter(options: GTMAdapterOptions = {}): ODLPlugin {
  const {
    dataLayerName = 'dataLayer',
    eventNameMap = {},
    includeContext = false,
    flattenData = true,
  } = options;

  const mergedEventMap = { ...DEFAULT_EVENT_MAP, ...eventNameMap };

  function getDataLayer(): DataLayerEvent[] {
    if (typeof window === 'undefined') return [];
    const dl = window[dataLayerName];
    if (!Array.isArray(dl)) {
      (window as Record<string, unknown>)[dataLayerName] = [];
      return window[dataLayerName] as DataLayerEvent[];
    }
    return dl as DataLayerEvent[];
  }

  function pushToDataLayer(gtmEvent: DataLayerEvent): void {
    const dl = getDataLayer();
    dl.push(gtmEvent);
  }

  return {
    name: 'gtm-adapter',

    initialize() {
      // Ensure dataLayer exists
      if (typeof window !== 'undefined') {
        (window as Record<string, unknown>)[dataLayerName] =
          (window as Record<string, unknown>)[dataLayerName] || [];
      }
    },

    afterEvent(event: ODLEvent) {
      const gtmEventName = mergedEventMap[event.event] ?? event.event.replace(/\./g, '_');

      let gtmEvent: DataLayerEvent = { event: gtmEventName };

      // Handle ecommerce events specially for GA4 format
      if (event.event.startsWith('ecommerce.') && event.data) {
        const ecomData = mapEcommerceData(event.event, event.data);
        gtmEvent = { ...gtmEvent, ecommerce: ecomData };
      } else if (event.data) {
        // For non-ecommerce events, add data fields directly
        if (flattenData) {
          Object.assign(gtmEvent, flattenObject(event.data));
        } else {
          gtmEvent.data = event.data;
        }
      }

      // Add custom dimensions
      if (event.customDimensions) {
        Object.assign(gtmEvent, event.customDimensions);
      }

      // Optionally include context
      if (includeContext && event.context) {
        gtmEvent.context = event.context;
      }

      // Add ODL metadata
      gtmEvent.odl_event_id = event.id;
      gtmEvent.odl_timestamp = event.timestamp;

      pushToDataLayer(gtmEvent);
    },

    destroy() {
      // Nothing to clean up
    },
  };
}

export default gtmAdapter;
