/**
 * @opendatalayer/adapter-piwik
 *
 * Maps OpenDataLayer events to Piwik PRO / Matomo tracking API.
 * Routes events to the _paq command queue using the standard
 * _paq.push(['methodName', args...]) pattern.
 */

export interface PiwikAdapterOptions {
  /** Custom _paq array reference (default: window._paq) */
  paqInstance?: unknown[];
  /** Map of ODL event names to Piwik event categories */
  eventCategoryMap?: Record<string, string>;
  /** Map of ODL custom dimension keys to Piwik custom dimension IDs */
  customDimensionMap?: Record<string, number>;
}

/** Minimal _paq interface for type safety */
type PaqArray = unknown[][];

declare global {
  interface Window {
    _paq?: PaqArray;
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

/** Push a command to the _paq array */
function pushCommand(paq: PaqArray, ...args: unknown[]): void {
  paq.push(args);
}

/** Set custom dimensions on _paq before a tracking call */
function setCustomDimensions(
  paq: PaqArray,
  event: ODLEvent,
  customDimensionMap: Record<string, number>,
): void {
  if (!event.customDimensions) return;

  for (const [key, value] of Object.entries(event.customDimensions)) {
    const dimensionId = customDimensionMap[key];
    if (dimensionId !== undefined) {
      pushCommand(paq, 'setCustomDimension', dimensionId, String(value));
    }
  }
}

/** Handle page.view events */
function handlePageView(paq: PaqArray, event: ODLEvent): void {
  const title = event.data?.title as string | undefined;
  if (title) {
    pushCommand(paq, 'trackPageView', title);
  } else {
    pushCommand(paq, 'trackPageView');
  }
}

/** Handle page.virtual_view events */
function handleVirtualPageView(paq: PaqArray, event: ODLEvent): void {
  const url = (event.data?.url as string | undefined) ?? (event.data?.path as string | undefined);
  if (url) {
    pushCommand(paq, 'setCustomUrl', url);
  }
  const title = event.data?.title as string | undefined;
  if (title) {
    pushCommand(paq, 'setDocumentTitle', title);
  }
  pushCommand(paq, 'trackPageView');
}

/** Handle search.performed events */
function handleSiteSearch(paq: PaqArray, event: ODLEvent): void {
  const data = event.data ?? {};
  const keyword = (data.query as string | undefined) ?? (data.keyword as string | undefined) ?? '';
  const category = (data.category as string | undefined) ?? false;
  const resultCount =
    data.resultCount !== undefined
      ? Number(data.resultCount)
      : data.results !== undefined
        ? Number(data.results)
        : false;
  pushCommand(paq, 'trackSiteSearch', keyword, category, resultCount);
}

/** Handle ecommerce.product_viewed events */
function handleProductViewed(paq: PaqArray, event: ODLEvent): void {
  const data = event.data ?? {};
  const product = (data.product as Record<string, unknown> | undefined) ?? data;
  const sku = (product.sku as string | undefined) ?? (product.id as string | undefined) ?? '';
  const name = (product.name as string | undefined) ?? '';
  const category =
    (product.category as string | undefined) ??
    (Array.isArray(product.categories) ? (product.categories[0] as string) : '');
  const price = product.price !== undefined ? Number(product.price) : 0;
  pushCommand(paq, 'setEcommerceView', sku, name, category, price);
  pushCommand(paq, 'trackPageView');
}

/** Handle ecommerce.product_added and ecommerce.product_removed events */
function handleCartUpdate(paq: PaqArray, event: ODLEvent): void {
  const data = event.data ?? {};
  const product = (data.product as Record<string, unknown> | undefined) ?? data;
  const sku = (product.sku as string | undefined) ?? (product.id as string | undefined) ?? '';
  const name = (product.name as string | undefined) ?? '';
  const category =
    (product.category as string | undefined) ??
    (Array.isArray(product.categories) ? (product.categories[0] as string) : '');
  const price = product.price !== undefined ? Number(product.price) : 0;
  const quantity = product.quantity !== undefined ? Number(product.quantity) : 1;

  pushCommand(paq, 'addEcommerceItem', sku, name, category, price, quantity);

  const cartTotal =
    data.cartTotal !== undefined
      ? Number(data.cartTotal)
      : data.total !== undefined
        ? Number(data.total)
        : 0;
  pushCommand(paq, 'trackEcommerceCartUpdate', cartTotal);
}

/** Handle ecommerce.purchase events */
function handlePurchase(paq: PaqArray, event: ODLEvent): void {
  const data = event.data ?? {};

  // Add all items
  const products = data.products as Record<string, unknown>[] | undefined;
  if (Array.isArray(products)) {
    for (const product of products) {
      const sku = (product.sku as string | undefined) ?? (product.id as string | undefined) ?? '';
      const name = (product.name as string | undefined) ?? '';
      const category =
        (product.category as string | undefined) ??
        (Array.isArray(product.categories) ? (product.categories[0] as string) : '');
      const price = product.price !== undefined ? Number(product.price) : 0;
      const quantity = product.quantity !== undefined ? Number(product.quantity) : 1;
      pushCommand(paq, 'addEcommerceItem', sku, name, category, price, quantity);
    }
  }

  const orderId =
    (data.orderId as string | undefined) ?? (data.transactionId as string | undefined) ?? '';
  const grandTotal =
    data.total !== undefined
      ? Number(data.total)
      : data.revenue !== undefined
        ? Number(data.revenue)
        : 0;
  const subTotal = data.subTotal !== undefined ? Number(data.subTotal) : grandTotal;
  const tax = data.tax !== undefined ? Number(data.tax) : 0;
  const shipping = data.shipping !== undefined ? Number(data.shipping) : 0;
  const discount = data.discount !== undefined ? Number(data.discount) : false;

  pushCommand(paq, 'trackEcommerceOrder', orderId, grandTotal, subTotal, tax, shipping, discount);
}

/** Handle user.identified events */
function handleUserIdentified(paq: PaqArray, event: ODLEvent): void {
  const data = event.data ?? {};
  const userId = (data.userId as string | undefined) ?? (data.id as string | undefined);
  if (userId) {
    pushCommand(paq, 'setUserId', userId);
  }
}

/** Handle user.signed_out events */
function handleUserSignedOut(paq: PaqArray): void {
  pushCommand(paq, 'resetUserId');
  pushCommand(paq, 'appendToTrackingUrl', 'new_visit=1');
  pushCommand(paq, 'trackPageView');
}

/** Handle generic/fallback events via trackEvent */
function handleGenericEvent(
  paq: PaqArray,
  event: ODLEvent,
  eventCategoryMap: Record<string, string>,
): void {
  const parts = event.event.split('.');
  const rawCategory = parts[0] ?? 'unknown';
  const action = parts.slice(1).join('.') || 'unknown';

  const category = eventCategoryMap[event.event] ?? rawCategory;

  const data = event.data ?? {};
  const name = (data.label as string | undefined) ?? undefined;
  const value = data.value !== undefined ? Number(data.value) : undefined;

  pushCommand(paq, 'trackEvent', category, action, name, value);
}

export function piwikAdapter(options: PiwikAdapterOptions = {}): ODLPlugin {
  const { paqInstance, eventCategoryMap = {}, customDimensionMap = {} } = options;

  function getPaq(): PaqArray | undefined {
    if (paqInstance) return paqInstance as PaqArray;
    if (typeof window !== 'undefined') return window._paq;
    return undefined;
  }

  return {
    name: 'piwik-adapter',

    initialize() {
      if (typeof window === 'undefined') return;

      // Ensure _paq exists if not using a custom instance
      if (!paqInstance) {
        window._paq = window._paq ?? [];
      }

      const paq = getPaq();
      if (!paq) {
        console.warn(
          '[@opendatalayer/adapter-piwik] _paq not found. ' +
            'Make sure Piwik PRO or Matomo is loaded before initializing the adapter.',
        );
      }
    },

    afterEvent(event: ODLEvent) {
      const paq = getPaq();
      if (!paq) return;

      // Set custom dimensions before any tracking call
      setCustomDimensions(paq, event, customDimensionMap);

      switch (event.event) {
        case 'page.view':
          handlePageView(paq, event);
          return;

        case 'page.virtual_view':
          handleVirtualPageView(paq, event);
          return;

        case 'search.performed':
          handleSiteSearch(paq, event);
          return;

        case 'ecommerce.product_viewed':
          handleProductViewed(paq, event);
          return;

        case 'ecommerce.product_added':
        case 'ecommerce.product_removed':
          handleCartUpdate(paq, event);
          return;

        case 'ecommerce.purchase':
          handlePurchase(paq, event);
          return;

        case 'user.identified':
          handleUserIdentified(paq, event);
          return;

        case 'user.signed_out':
          handleUserSignedOut(paq);
          return;

        default:
          handleGenericEvent(paq, event, eventCategoryMap);
      }
    },

    destroy() {
      // Nothing to clean up
    },
  };
}

export default piwikAdapter;
