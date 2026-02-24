/**
 * @opendatalayer/types
 *
 * TypeScript types for the OpenDataLayer protocol.
 * Core types are hand-written. Event-specific and context types
 * are generated from JSON schemas via `npm run generate:types`.
 */

// ---- Core Types ----

/** ISO 8601 datetime string */
export type Timestamp = string;

/** UUID v4 string */
export type UUID = string;

/** ISO 4217 currency code */
export type CurrencyCode = string;

/** BCP 47 locale string */
export type Locale = string;

/** Dot-namespaced event name (e.g., "ecommerce.purchase") */
export type EventName = string;

/** The base ODL event envelope */
export interface ODLEvent<TData = Record<string, unknown>> {
  /** Dot-namespaced event name */
  event: EventName;
  /** Unique event ID (UUID v4) */
  id: UUID;
  /** ISO 8601 timestamp */
  timestamp: Timestamp;
  /** Protocol version */
  specVersion: '1.0.0';
  /** Ambient context */
  context?: ODLContext;
  /** Event-specific data payload */
  data?: TData;
  /** Custom key-value pairs */
  customDimensions?: Record<string, string | number | boolean>;
  /** Source application info */
  source?: ODLSource;
}

export interface ODLSource {
  name: string;
  version: string;
}

/** Combined context object */
export interface ODLContext {
  page?: PageContext;
  user?: UserContext;
  consent?: ConsentContext;
  session?: SessionContext;
  device?: DeviceContext;
  app?: AppContext;
  campaign?: CampaignContext;
  location?: LocationContext;
}

// ---- Context Types ----

export interface PageContext {
  url: string;
  path: string;
  title?: string;
  referrer?: string;
  search?: string;
  hash?: string;
  category?: string;
  type?: string;
  language?: string;
  encoding?: string;
}

export interface UserContext {
  id?: string;
  anonymousId?: string;
  email?: string;
  hashedEmail?: string;
  traits?: UserTraits;
  isAuthenticated?: boolean;
  isNewUser?: boolean;
  segments?: string[];
}

export interface UserTraits {
  firstName?: string;
  lastName?: string;
  name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  company?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ConsentContext {
  status?: 'granted' | 'denied' | 'pending';
  purposes?: Record<string, boolean>;
  method?: 'banner' | 'preference_center' | 'api' | 'implicit';
  version?: string;
  updatedAt?: string;
  gpcEnabled?: boolean;
  doNotTrack?: boolean;
}

export interface SessionContext {
  id: string;
  startedAt?: string;
  isNew?: boolean;
  count?: number;
  referrer?: string;
  landingPage?: string;
  duration?: number;
  pageViews?: number;
}

export interface DeviceContext {
  type?: 'desktop' | 'mobile' | 'tablet' | 'tv' | 'wearable' | 'bot' | 'other';
  os?: { name: string; version: string };
  browser?: { name: string; version: string };
  screen?: {
    width: number;
    height: number;
    density?: number;
    orientation?: 'portrait' | 'landscape';
  };
  viewport?: { width: number; height: number };
  userAgent?: string;
  language?: string;
  cookiesEnabled?: boolean;
  javaScriptEnabled?: boolean;
  touchEnabled?: boolean;
  connectionType?: string;
}

export interface AppContext {
  name: string;
  version: string;
  build?: string;
  environment?: 'production' | 'staging' | 'development' | 'testing';
  platform?: 'web' | 'ios' | 'android' | 'react-native' | 'flutter' | 'electron' | 'other';
  namespace?: string;
}

export interface CampaignContext {
  source?: string;
  medium?: string;
  name?: string;
  term?: string;
  content?: string;
  id?: string;
  clickId?: string;
  clickIdType?: 'gclid' | 'fbclid' | 'msclkid' | 'dclid' | 'ttclid' | 'other';
}

export interface LocationContext {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  ipAddress?: string;
}

// ---- Common Data Types ----

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  variant?: string;
  price: number;
  currency?: string;
  quantity?: number;
  coupon?: string;
  discount?: number;
  position?: number;
  url?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface Promotion {
  id: string;
  name: string;
  creative?: string;
  position?: string;
}

export interface MediaObject {
  id: string;
  title: string;
  type?: 'video' | 'audio' | 'livestream' | 'podcast' | 'other';
  duration?: number;
  url?: string;
  provider?: string;
  author?: string;
  category?: string;
  publishedAt?: string;
  [key: string]: unknown;
}

// ---- Event Data Types ----

// Page events
export interface PageLeaveData {
  dwellTime?: number;
  scrollDepth?: number;
}

export interface VirtualViewData {
  url: string;
  path: string;
  title?: string;
  previousUrl?: string;
  previousPath?: string;
}

// Ecommerce events
export interface ProductViewedData {
  product: Product;
}
export interface ProductListViewedData {
  listId?: string;
  listName?: string;
  products: Product[];
}
export interface ProductClickedData {
  product: Product;
  listId?: string;
  listName?: string;
}
export interface ProductAddedData {
  product: Product;
  cartId?: string;
}
export interface ProductRemovedData {
  product: Product;
  cartId?: string;
}
export interface CartViewedData {
  cartId?: string;
  products: Product[];
  total?: number;
  currency?: string;
}
export interface CheckoutStartedData {
  orderId?: string;
  total: number;
  currency: string;
  products: Product[];
  coupon?: string;
}
export interface CheckoutStepCompletedData {
  step: number;
  stepName?: string;
  shippingMethod?: string;
  paymentMethod?: string;
}
export interface PaymentInfoEnteredData {
  orderId?: string;
  paymentMethod: string;
  total?: number;
  currency?: string;
}
export interface PurchaseData {
  orderId: string;
  total: number;
  revenue?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  currency: string;
  coupon?: string;
  paymentMethod?: string;
  products: Product[];
}
export interface RefundData {
  orderId: string;
  total?: number;
  currency?: string;
  products?: Product[];
}
export interface CouponAppliedData {
  coupon: string;
  orderId?: string;
  discount?: number;
}
export interface CouponRemovedData {
  coupon: string;
  orderId?: string;
}
export interface WishlistProductAddedData {
  product: Product;
  wishlistId?: string;
  wishlistName?: string;
}
export interface WishlistProductRemovedData {
  product: Product;
  wishlistId?: string;
}
export interface PromotionViewedData {
  promotion: Promotion;
}
export interface PromotionClickedData {
  promotion: Promotion;
}

// Re-export generated types when available
// export * from './generated/index.js';
