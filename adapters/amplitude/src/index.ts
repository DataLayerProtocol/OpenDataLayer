/**
 * @opendatalayer/adapter-amplitude
 *
 * Maps OpenDataLayer events to Amplitude Analytics SDK calls.
 * Routes events to amplitude.track(), amplitude.identify(), amplitude.setUserId(),
 * amplitude.revenue(), and amplitude.setGroup() based on the ODL event type.
 */

export interface AmplitudeAdapterOptions {
  /** Custom Amplitude instance (default: window.amplitude) */
  amplitudeInstance?: unknown;
  /** Map of ODL event names to custom Amplitude event names */
  eventNameMap?: Record<string, string>;
  /** Whether to automatically set user properties from ODL context (default: true) */
  autoSetUserProperties?: boolean;
}

/** Minimal Amplitude Analytics SDK interface */
interface AmplitudeSDK {
  track(eventName: string, eventProperties?: Record<string, unknown>): void;
  identify(identify: unknown): void;
  setUserId(userId: string | null): void;
  setGroup(groupType: string, groupName: string | string[]): void;
  revenue(revenue: unknown): void;
  Identify: new () => AmplitudeIdentify;
  Revenue: new () => AmplitudeRevenue;
}

interface AmplitudeIdentify {
  set(key: string, value: unknown): AmplitudeIdentify;
}

interface AmplitudeRevenue {
  setProductId(productId: string): AmplitudeRevenue;
  setPrice(price: number): AmplitudeRevenue;
  setQuantity(quantity: number): AmplitudeRevenue;
  setRevenueType(revenueType: string): AmplitudeRevenue;
  setEventProperties(properties: Record<string, unknown>): AmplitudeRevenue;
}

declare global {
  interface Window {
    amplitude?: AmplitudeSDK;
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

/** Default ODL -> Amplitude event name mappings */
const DEFAULT_EVENT_MAP: Record<string, string> = {
  'page.view': 'Page Viewed',
  'page.virtual_view': 'Virtual Page Viewed',
  'ecommerce.product_viewed': 'Product Viewed',
  'ecommerce.product_added': 'Product Added',
  'ecommerce.product_removed': 'Product Removed',
  'ecommerce.purchase': 'Purchase',
  'ecommerce.checkout_started': 'Checkout Started',
  'ecommerce.cart_viewed': 'Cart Viewed',
  'user.signed_up': 'Sign Up',
  'user.signed_in': 'Sign In',
  'user.signed_out': 'Sign Out',
  'search.performed': 'Search',
};

/** Flatten nested objects into dot-free key paths using underscores */
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

/** Build event properties from ODL event data and customDimensions, flattened */
function buildEventProperties(event: ODLEvent): Record<string, unknown> {
  let properties: Record<string, unknown> = {};

  if (event.data) {
    properties = flattenObject(event.data);
  }

  if (event.customDimensions) {
    Object.assign(properties, event.customDimensions);
  }

  return properties;
}

/** Resolve the display event name from the ODL event name */
function resolveEventName(eventName: string, mergedEventMap: Record<string, string>): string {
  if (mergedEventMap[eventName]) {
    return mergedEventMap[eventName];
  }

  // Convert dot-separated names to Title Case: "ecommerce.product_viewed" -> "Product Viewed"
  return (
    eventName
      .split('.')
      .pop()
      ?.split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') ?? eventName
  );
}

export function amplitudeAdapter(options: AmplitudeAdapterOptions = {}): ODLPlugin {
  const { amplitudeInstance, eventNameMap = {}, autoSetUserProperties = true } = options;

  const mergedEventMap = { ...DEFAULT_EVENT_MAP, ...eventNameMap };

  let lastIdentifiedUserId: string | undefined;

  function getAmplitude(): AmplitudeSDK | undefined {
    if (amplitudeInstance) return amplitudeInstance as AmplitudeSDK;
    if (typeof window !== 'undefined') return window.amplitude;
    return undefined;
  }

  /** Set user properties from ODL context.user via Amplitude Identify */
  function applyUserProperties(amp: AmplitudeSDK, context: Record<string, unknown>): void {
    const user = context.user as Record<string, unknown> | undefined;
    if (!user || typeof user !== 'object') return;

    const entries = Object.entries(user).filter(([key]) => key !== 'id');
    if (entries.length === 0) return;

    const identify = new amp.Identify();
    for (const [key, value] of entries) {
      identify.set(key, value);
    }
    amp.identify(identify);
  }

  /** Track revenue for each product in a purchase event */
  function trackPurchaseRevenue(amp: AmplitudeSDK, data: Record<string, unknown>): void {
    const products = data.products as Record<string, unknown>[] | undefined;
    if (!Array.isArray(products)) return;

    for (const product of products) {
      const rev = new amp.Revenue();

      const productId = product.id ?? product.sku ?? product.name;
      if (typeof productId === 'string' || typeof productId === 'number') {
        rev.setProductId(String(productId));
      }

      if (typeof product.price === 'number') {
        rev.setPrice(product.price);
      }

      const quantity = typeof product.quantity === 'number' ? product.quantity : 1;
      rev.setQuantity(quantity);

      if (typeof product.revenueType === 'string') {
        rev.setRevenueType(product.revenueType);
      }

      // Attach additional product properties
      const extraProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(product)) {
        if (!['id', 'sku', 'price', 'quantity', 'revenueType'].includes(key)) {
          extraProps[key] = value;
        }
      }
      if (Object.keys(extraProps).length > 0) {
        rev.setEventProperties(extraProps);
      }

      amp.revenue(rev);
    }
  }

  return {
    name: 'amplitude-adapter',

    initialize() {
      const amp = getAmplitude();
      if (!amp && typeof window !== 'undefined') {
        console.warn(
          '[@opendatalayer/adapter-amplitude] Amplitude SDK not found. ' +
            'Make sure Amplitude is loaded before initializing the adapter.',
        );
      }
    },

    afterEvent(event: ODLEvent) {
      const amp = getAmplitude();
      if (!amp) return;

      // Auto-set user properties from context when enabled
      if (autoSetUserProperties && event.context) {
        applyUserProperties(amp, event.context);
      }

      // Handle user.identified -> setUserId + identify with traits
      if (event.event === 'user.identified') {
        const userId = event.data?.userId as string | undefined;
        if (userId && userId !== lastIdentifiedUserId) {
          amp.setUserId(userId);
          lastIdentifiedUserId = userId;
        }

        const traits = event.data?.traits as Record<string, unknown> | undefined;
        if (traits && typeof traits === 'object') {
          const identify = new amp.Identify();
          for (const [key, value] of Object.entries(traits)) {
            identify.set(key, value);
          }
          amp.identify(identify);
        }
        return;
      }

      // Handle user.signed_out -> reset userId
      if (event.event === 'user.signed_out') {
        amp.setUserId(null);
        lastIdentifiedUserId = undefined;
        amp.track(resolveEventName(event.event, mergedEventMap));
        return;
      }

      // Handle ecommerce.purchase -> revenue() per product + track('Purchase')
      if (event.event === 'ecommerce.purchase' && event.data) {
        trackPurchaseRevenue(amp, event.data);
        const properties = buildEventProperties(event);
        amp.track(resolveEventName(event.event, mergedEventMap), properties);
        return;
      }

      // Handle page.view events
      if (event.event.startsWith('page.')) {
        const properties = buildEventProperties(event);
        amp.track(resolveEventName(event.event, mergedEventMap), properties);
        return;
      }

      // Handle group identification
      if (event.event === 'user.group_identified' && event.data) {
        const groupType = event.data.groupType as string | undefined;
        const groupName = event.data.groupName as string | string[] | undefined;
        if (groupType && groupName) {
          amp.setGroup(groupType, groupName);
        }
        return;
      }

      // All other events -> amplitude.track()
      const eventName = resolveEventName(event.event, mergedEventMap);
      const properties = buildEventProperties(event);
      amp.track(eventName, properties);
    },

    destroy() {
      lastIdentifiedUserId = undefined;
    },
  };
}

export type { AmplitudeSDK, AmplitudeIdentify, AmplitudeRevenue };
export default amplitudeAdapter;
