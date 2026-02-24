/**
 * @opendatalayer/adapter-segment
 *
 * Maps OpenDataLayer events to Segment's analytics.js API.
 * Routes events to analytics.page(), analytics.track(), and analytics.identify()
 * based on the ODL event type.
 */

export interface SegmentAdapterOptions {
  /** Custom analytics instance (default: window.analytics) */
  analyticsInstance?: SegmentAnalytics;
  /** Map of ODL event names to custom Segment event names */
  eventNameMap?: Record<string, string>;
  /** Whether to automatically call identify() when user context is present (default: true) */
  autoIdentify?: boolean;
  /** Whether to include ODL metadata (event id, timestamp) in track properties (default: false) */
  includeMetadata?: boolean;
}

/** Minimal Segment analytics.js interface */
interface SegmentAnalytics {
  page(category?: string, name?: string, properties?: Record<string, unknown>): void;
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  identify(traits: Record<string, unknown>): void;
  group(groupId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

declare global {
  interface Window {
    analytics?: SegmentAnalytics;
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

/** Default ODL -> Segment event name mappings (Segment ecommerce spec) */
const DEFAULT_EVENT_MAP: Record<string, string> = {
  'ecommerce.product_viewed': 'Product Viewed',
  'ecommerce.product_list_viewed': 'Product List Viewed',
  'ecommerce.product_clicked': 'Product Clicked',
  'ecommerce.product_added': 'Product Added',
  'ecommerce.product_removed': 'Product Removed',
  'ecommerce.cart_viewed': 'Cart Viewed',
  'ecommerce.checkout_started': 'Checkout Started',
  'ecommerce.checkout_step_viewed': 'Checkout Step Viewed',
  'ecommerce.checkout_step_completed': 'Checkout Step Completed',
  'ecommerce.payment_info_entered': 'Payment Info Entered',
  'ecommerce.purchase': 'Order Completed',
  'ecommerce.refund': 'Order Refunded',
  'ecommerce.promotion_viewed': 'Promotion Viewed',
  'ecommerce.promotion_clicked': 'Promotion Clicked',
  'ecommerce.coupon_entered': 'Coupon Entered',
  'ecommerce.coupon_applied': 'Coupon Applied',
  'ecommerce.coupon_denied': 'Coupon Denied',
  'ecommerce.coupon_removed': 'Coupon Removed',
  'user.signed_up': 'Signed Up',
  'user.signed_in': 'Signed In',
  'user.signed_out': 'Signed Out',
  'search.performed': 'Products Searched',
  'interaction.share': 'Content Shared',
  'interaction.file_downloaded': 'File Downloaded',
};

/** Map ODL product to Segment product format */
function mapProduct(product: Record<string, unknown>): Record<string, unknown> {
  return {
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    variant: product.variant,
    price: product.price,
    quantity: product.quantity ?? 1,
    coupon: product.coupon,
    position: product.position,
    url: product.url,
    image_url: product.imageUrl,
  };
}

/** Map ODL ecommerce event data to Segment ecommerce format */
function mapEcommerceProperties(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Map products
  if (data.products && Array.isArray(data.products)) {
    result.products = (data.products as Record<string, unknown>[]).map(mapProduct);
  }
  if (data.product && typeof data.product === 'object') {
    // Single product events: flatten product fields into top-level
    Object.assign(result, mapProduct(data.product as Record<string, unknown>));
  }

  // Map order/transaction fields
  if (data.orderId) result.order_id = data.orderId;
  if (data.total !== undefined) result.total = data.total;
  if (data.revenue !== undefined) result.revenue = data.revenue;
  if (data.currency) result.currency = data.currency;
  if (data.tax !== undefined) result.tax = data.tax;
  if (data.shipping !== undefined) result.shipping = data.shipping;
  if (data.discount !== undefined) result.discount = data.discount;
  if (data.coupon) result.coupon = data.coupon;
  if (data.affiliation) result.affiliation = data.affiliation;

  // Map list fields
  if (data.listId) result.list_id = data.listId;
  if (data.listName) result.category = data.listName;

  // Map checkout step
  if (data.step !== undefined) result.step = data.step;
  if (data.paymentMethod) result.payment_method = data.paymentMethod;
  if (data.shippingMethod) result.shipping_method = data.shippingMethod;

  // Map promotion fields
  if (data.promotion && typeof data.promotion === 'object') {
    const promo = data.promotion as Record<string, unknown>;
    result.promotion_id = promo.id;
    result.name = promo.name;
    result.creative = promo.creative;
    result.position = promo.position;
  }

  // Map search
  if (data.query) result.query = data.query;

  return result;
}

/** Extract user traits from ODL context */
function extractUserTraits(context: Record<string, unknown>): Record<string, unknown> | undefined {
  const user = context.user as Record<string, unknown> | undefined;
  if (!user) return undefined;

  const traits: Record<string, unknown> = {};
  if (user.email) traits.email = user.email;
  if (user.name) traits.name = user.name;
  if (user.firstName) traits.firstName = user.firstName;
  if (user.lastName) traits.lastName = user.lastName;
  if (user.phone) traits.phone = user.phone;
  if (user.company) traits.company = user.company;
  if (user.createdAt) traits.createdAt = user.createdAt;

  return Object.keys(traits).length > 0 ? traits : undefined;
}

export function segmentAdapter(options: SegmentAdapterOptions = {}): ODLPlugin {
  const {
    analyticsInstance,
    eventNameMap = {},
    autoIdentify = true,
    includeMetadata = false,
  } = options;

  const mergedEventMap = { ...DEFAULT_EVENT_MAP, ...eventNameMap };

  let lastIdentifiedUserId: string | undefined;

  function getAnalytics(): SegmentAnalytics | undefined {
    if (analyticsInstance) return analyticsInstance;
    if (typeof window !== 'undefined') return window.analytics;
    return undefined;
  }

  return {
    name: 'segment-adapter',

    initialize() {
      // Validate analytics.js is available
      const analytics = getAnalytics();
      if (!analytics && typeof window !== 'undefined') {
        console.warn(
          '[@opendatalayer/adapter-segment] analytics.js not found. ' +
            'Make sure Segment is loaded before initializing the adapter.',
        );
      }
    },

    afterEvent(event: ODLEvent) {
      const analytics = getAnalytics();
      if (!analytics) return;

      // Auto-identify when user context changes
      if (autoIdentify && event.context) {
        const user = event.context.user as Record<string, unknown> | undefined;
        if (user?.id && String(user.id) !== lastIdentifiedUserId) {
          const traits = extractUserTraits(event.context);
          analytics.identify(String(user.id), traits ?? {});
          lastIdentifiedUserId = String(user.id);
        }
      }

      // Handle user.identified explicitly
      if (event.event === 'user.identified' && event.data) {
        const userId = event.data.userId as string | undefined;
        const traits = (event.data.traits as Record<string, unknown>) ?? {};
        if (userId) {
          analytics.identify(userId, traits);
          lastIdentifiedUserId = userId;
        } else {
          analytics.identify(traits);
        }
        return;
      }

      // Handle page events
      if (event.event.startsWith('page.')) {
        const properties: Record<string, unknown> = { ...event.data };
        if (event.customDimensions) {
          Object.assign(properties, event.customDimensions);
        }
        if (includeMetadata) {
          properties.odl_event_id = event.id;
          properties.odl_timestamp = event.timestamp;
        }

        const category = (properties.category as string) ?? undefined;
        const name = (properties.name as string) ?? (properties.title as string) ?? undefined;
        analytics.page(category, name, properties);
        return;
      }

      // Handle group identification
      if (event.event === 'user.group_identified' && event.data) {
        const groupId = event.data.groupId as string | undefined;
        const traits = (event.data.traits as Record<string, unknown>) ?? {};
        if (groupId) {
          analytics.group(groupId, traits);
        }
        return;
      }

      // All other events -> analytics.track()
      const segmentEventName =
        mergedEventMap[event.event] ??
        event.event
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

      let properties: Record<string, unknown>;

      // Map ecommerce data to Segment spec format
      if (event.event.startsWith('ecommerce.') && event.data) {
        properties = mapEcommerceProperties(event.data);
      } else {
        properties = { ...event.data };
      }

      // Add custom dimensions
      if (event.customDimensions) {
        Object.assign(properties, event.customDimensions);
      }

      // Optionally include ODL metadata
      if (includeMetadata) {
        properties.odl_event_id = event.id;
        properties.odl_timestamp = event.timestamp;
      }

      analytics.track(segmentEventName, properties);
    },

    destroy() {
      lastIdentifiedUserId = undefined;
    },
  };
}

export type { SegmentAnalytics };
export default segmentAdapter;
