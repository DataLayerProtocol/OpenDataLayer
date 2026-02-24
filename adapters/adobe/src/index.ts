/**
 * @opendatalayer/adapter-adobe
 *
 * Maps OpenDataLayer events to Adobe Analytics (AppMeasurement s.tl()/s.t())
 * and Adobe Experience Platform Web SDK (alloy sendEvent).
 */

export interface AdobeAdapterOptions {
  /** Adobe tracking mode: 'appmeasurement' or 'websdk' (default: 'appmeasurement') */
  mode?: 'appmeasurement' | 'websdk';
  /** Map of ODL event names to Adobe event names */
  eventNameMap?: Record<string, string>;
  /** Map of ODL custom dimensions to Adobe eVars (e.g., "userType" -> "eVar1") */
  eVarMap?: Record<string, string>;
  /** Map of ODL custom dimensions to Adobe props (e.g., "pageType" -> "prop1") */
  propMap?: Record<string, string>;
}

/** Minimal AppMeasurement interface for window.s */
interface AppMeasurementInstance {
  t(): void;
  tl(obj: unknown, type: string, name: string): void;
  clearVars?(): void;
  events: string;
  products: string;
  pageName: string;
  channel: string;
  campaign: string;
  purchaseID: string;
  transactionID: string;
  [key: string]: unknown;
}

/** Minimal alloy function interface for AEP Web SDK */
type AlloyFunction = (command: string, options: Record<string, unknown>) => Promise<unknown>;

declare global {
  interface Window {
    s?: AppMeasurementInstance;
    alloy?: AlloyFunction;
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

/** Default ODL -> Adobe event name mappings */
const DEFAULT_EVENT_MAP: Record<string, string> = {
  'ecommerce.product_viewed': 'prodView',
  'ecommerce.product_list_viewed': 'prodView',
  'ecommerce.product_added': 'scAdd',
  'ecommerce.product_removed': 'scRemove',
  'ecommerce.cart_viewed': 'scView',
  'ecommerce.checkout_started': 'scCheckout',
  'ecommerce.purchase': 'purchase',
  'user.signed_up': 'event1',
  'user.signed_in': 'event2',
  'search.performed': 'event3',
};

/**
 * Build an Adobe products string from an array of product objects.
 * Format: "category;productName;quantity;price[,category;productName;quantity;price]"
 */
function buildProductString(products: Record<string, unknown>[]): string {
  return products
    .map((product) => {
      const category = String(product.category ?? '');
      const name = String(product.name ?? product.id ?? '');
      const quantity = product.quantity !== undefined ? String(product.quantity) : '1';
      const price = product.price !== undefined ? String(product.price) : '';
      return `${category};${name};${quantity};${price}`;
    })
    .join(',');
}

/** Extract a products array from event data, handling both single product and array */
function extractProducts(data: Record<string, unknown>): Record<string, unknown>[] {
  if (data.products && Array.isArray(data.products)) {
    return data.products as Record<string, unknown>[];
  }
  if (data.product && typeof data.product === 'object') {
    return [data.product as Record<string, unknown>];
  }
  return [];
}

/** Apply eVar and prop mappings from customDimensions to AppMeasurement instance */
function applyCustomDimensionMappings(
  s: AppMeasurementInstance,
  customDimensions: Record<string, string | number | boolean>,
  eVarMap: Record<string, string>,
  propMap: Record<string, string>,
): void {
  for (const [dimensionKey, dimensionValue] of Object.entries(customDimensions)) {
    const eVarName = eVarMap[dimensionKey];
    if (eVarName) {
      s[eVarName] = String(dimensionValue);
    }
    const propName = propMap[dimensionKey];
    if (propName) {
      s[propName] = String(dimensionValue);
    }
  }
}

/** Map an ODL event to AppMeasurement variables and fire the appropriate beacon */
function handleAppMeasurement(
  event: ODLEvent,
  mergedEventMap: Record<string, string>,
  eVarMap: Record<string, string>,
  propMap: Record<string, string>,
): void {
  if (typeof window === 'undefined') return;

  const s = window.s;
  if (!s) {
    console.warn(
      '[@opendatalayer/adapter-adobe] AppMeasurement (window.s) not found. ' +
        'Make sure Adobe Analytics is loaded before initializing the adapter.',
    );
    return;
  }

  // Map event name
  const adobeEventName = mergedEventMap[event.event] ?? event.event.replace(/\./g, '_');
  s.events = adobeEventName;

  // Map page data
  if (event.data) {
    const data = event.data;
    if (data.pageName !== undefined) s.pageName = String(data.pageName);
    if (data.name !== undefined) s.pageName = String(data.name);
    if (data.title !== undefined) s.pageName = String(data.title);
    if (data.channel !== undefined) s.channel = String(data.channel);
    if (data.campaign !== undefined) s.campaign = String(data.campaign);

    // Map search query
    if (data.query !== undefined) {
      const searchEVar = eVarMap.searchQuery ?? eVarMap.query;
      if (searchEVar) {
        s[searchEVar] = String(data.query);
      }
    }

    // Map ecommerce data
    if (event.event.startsWith('ecommerce.')) {
      const products = extractProducts(data);
      if (products.length > 0) {
        s.products = buildProductString(products);
      }

      if (data.orderId !== undefined) s.purchaseID = String(data.orderId);
      if (data.transactionId !== undefined) s.transactionID = String(data.transactionId);
    }
  }

  // Map custom dimensions to eVars and props
  if (event.customDimensions) {
    applyCustomDimensionMappings(s, event.customDimensions, eVarMap, propMap);
  }

  // Fire the appropriate beacon
  if (event.event === 'page.view' || event.event === 'page.virtual_view') {
    s.t();
  } else {
    s.tl(true, 'o', adobeEventName);
  }

  // Clear variables after tracking
  if (s.clearVars) {
    s.clearVars();
  }
}

/** Build XDM page details from event data */
function buildXdmPageDetails(data: Record<string, unknown>): Record<string, unknown> {
  const pageDetails: Record<string, unknown> = {};
  if (data.pageName !== undefined || data.name !== undefined || data.title !== undefined) {
    pageDetails.name = data.pageName ?? data.name ?? data.title;
  }
  if (data.url !== undefined) pageDetails.URL = data.url;
  if (data.path !== undefined) pageDetails.URL = data.path;
  return pageDetails;
}

/** Build XDM commerce and productListItems from event data */
function buildXdmCommerce(
  eventName: string,
  data: Record<string, unknown>,
): { commerce: Record<string, unknown>; productListItems: Record<string, unknown>[] } {
  const commerce: Record<string, unknown> = {};

  // Map event type to XDM commerce action
  const commerceActionMap: Record<string, string> = {
    'ecommerce.product_viewed': 'productViews',
    'ecommerce.product_list_viewed': 'productListViews',
    'ecommerce.product_added': 'productListAdds',
    'ecommerce.product_removed': 'productListRemovals',
    'ecommerce.cart_viewed': 'cartViews',
    'ecommerce.checkout_started': 'checkouts',
    'ecommerce.purchase': 'purchases',
    'ecommerce.refund': 'refunds',
  };

  const actionType = commerceActionMap[eventName];
  if (actionType) {
    commerce[actionType] = { value: 1 };
  }

  // Map order-level data
  if (data.orderId !== undefined || data.total !== undefined || data.revenue !== undefined) {
    const order: Record<string, unknown> = {};
    if (data.orderId !== undefined) order.purchaseID = String(data.orderId);
    if (data.currency !== undefined) order.currencyCode = String(data.currency);

    const priceTotal = data.revenue ?? data.total;
    if (priceTotal !== undefined) order.priceTotal = Number(priceTotal);

    commerce.order = order;
  }

  // Map products to productListItems
  const products = extractProducts(data);
  const productListItems = products.map((product) => {
    const item: Record<string, unknown> = {};
    if (product.name !== undefined) item.name = product.name;
    if (product.id !== undefined || product.sku !== undefined) {
      item.SKU = product.sku ?? product.id;
    }
    if (product.quantity !== undefined) item.quantity = Number(product.quantity);
    if (product.price !== undefined) item.priceTotal = Number(product.price);
    if (product.category !== undefined) {
      item.productCategories = { primary: String(product.category) };
    }
    return item;
  });

  return { commerce, productListItems };
}

/** Map an ODL event to AEP Web SDK (alloy) and send it */
function handleWebSDK(event: ODLEvent, mergedEventMap: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  const alloy = window.alloy;
  if (!alloy) {
    console.warn(
      '[@opendatalayer/adapter-adobe] AEP Web SDK (window.alloy) not found. ' +
        'Make sure the Web SDK is loaded before initializing the adapter.',
    );
    return;
  }

  const xdm: Record<string, unknown> = {};

  // Map page events to web.webPageDetails
  if (event.event.startsWith('page.') && event.data) {
    const pageDetails = buildXdmPageDetails(event.data);
    if (Object.keys(pageDetails).length > 0) {
      xdm.web = { webPageDetails: pageDetails };
    }
  }

  // Map ecommerce events
  if (event.event.startsWith('ecommerce.') && event.data) {
    const { commerce, productListItems } = buildXdmCommerce(event.event, event.data);
    xdm.commerce = commerce;
    if (productListItems.length > 0) {
      xdm.productListItems = productListItems;
    }
  }

  // Map search events
  if (event.event === 'search.performed' && event.data) {
    xdm.siteSearch = { phrase: event.data.query };
  }

  // Map event name
  const adobeEventName = mergedEventMap[event.event] ?? event.event.replace(/\./g, '_');
  xdm.eventType = adobeEventName;

  // Include custom dimensions as additional data
  const additionalData: Record<string, unknown> = {};
  if (event.customDimensions) {
    for (const [key, value] of Object.entries(event.customDimensions)) {
      additionalData[key] = value;
    }
  }

  // Include non-ecommerce, non-page data fields
  if (event.data && !event.event.startsWith('ecommerce.') && !event.event.startsWith('page.')) {
    for (const [key, value] of Object.entries(event.data)) {
      additionalData[key] = value;
    }
  }

  const sendOptions: Record<string, unknown> = { xdm };
  if (Object.keys(additionalData).length > 0) {
    sendOptions.data = additionalData;
  }

  void alloy('sendEvent', sendOptions);
}

export function adobeAdapter(options: AdobeAdapterOptions = {}): ODLPlugin {
  const { mode = 'appmeasurement', eventNameMap = {}, eVarMap = {}, propMap = {} } = options;

  const mergedEventMap = { ...DEFAULT_EVENT_MAP, ...eventNameMap };

  return {
    name: 'adobe-adapter',

    initialize() {
      if (typeof window === 'undefined') return;

      if (mode === 'appmeasurement') {
        if (!window.s) {
          console.warn(
            '[@opendatalayer/adapter-adobe] AppMeasurement (window.s) not found. ' +
              'Make sure Adobe Analytics is loaded before initializing the adapter.',
          );
        }
      } else {
        if (!window.alloy) {
          console.warn(
            '[@opendatalayer/adapter-adobe] AEP Web SDK (window.alloy) not found. ' +
              'Make sure the Web SDK is loaded before initializing the adapter.',
          );
        }
      }
    },

    afterEvent(event: ODLEvent) {
      if (typeof window === 'undefined') return;

      if (mode === 'appmeasurement') {
        handleAppMeasurement(event, mergedEventMap, eVarMap, propMap);
      } else {
        handleWebSDK(event, mergedEventMap);
      }
    },

    destroy() {
      // No persistent state to clean up
    },
  };
}

export default adobeAdapter;
