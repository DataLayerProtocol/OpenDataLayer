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
  subscription?: SubscriptionContext;
  experiment?: ExperimentContext;
  cart?: CartContext;
  account?: AccountContext;
  order?: OrderContext;
  loyalty?: LoyaltyContext;
  organization?: OrganizationContext;
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
  role?: string;
  locale?: string;
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
  region?: string;
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
  sdkName?: string;
  sdkVersion?: string;
  deployId?: string;
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

export interface SubscriptionContext {
  id?: string;
  planId?: string;
  planName?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused' | 'expired';
  interval?: 'monthly' | 'yearly' | 'weekly' | 'custom';
  amount?: number;
  currency?: string;
  startedAt?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAt?: string;
  renewalCount?: number;
}

export interface ExperimentContext {
  experiments?: ExperimentAssignment[];
  featureFlags?: Record<string, unknown>;
}

export interface ExperimentAssignment {
  experimentId?: string;
  experimentName?: string;
  variantId?: string;
  variantName?: string;
  isControl?: boolean;
}

export interface CartContext {
  id?: string;
  itemCount?: number;
  total?: number;
  subtotal?: number;
  currency?: string;
  coupon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountContext {
  id?: string;
  name?: string;
  plan?: string;
  industry?: string;
  employeeCount?: '1-10' | '11-50' | '51-200' | '201-1000' | '1001-5000' | '5000+';
  createdAt?: string;
  mrr?: number;
  domain?: string;
  country?: string;
  status?: 'active' | 'trialing' | 'suspended' | 'churned' | 'cancelled';
  seats?: number;
}

export interface OrderContext {
  id?: string;
  status?:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'returned'
    | 'cancelled';
  total?: number;
  currency?: string;
  itemCount?: number;
  placedAt?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface LoyaltyContext {
  programId?: string;
  programName?: string;
  memberId?: string;
  tier?: string;
  pointsBalance?: number;
  lifetimePoints?: number;
  tierExpiresAt?: string;
  memberSince?: string;
}

export interface OrganizationContext {
  id: string;
  name?: string;
  domain?: string;
  industry?: string;
  plan?: string;
  employeeCount?: number;
  country?: string;
  region?: string;
  createdAt?: string;
  status?: 'active' | 'trialing' | 'suspended' | 'churned';
  seats?: number;
  arr?: number;
  mrr?: number;
  tags?: string[];
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

export interface InvoiceLineItem {
  description?: string;
  amount?: number;
  quantity?: number;
}

export interface CrmDealProduct {
  id?: string;
  name?: string;
  value?: number;
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
export interface CartAbandonedData {
  cartId?: string;
  products: Product[];
  total?: number;
  currency?: CurrencyCode;
  itemCount?: number;
  cartAge?: number;
  lastActivityAt?: Timestamp;
  abandonmentPage?: string;
  coupon?: string;
}
export interface ShippingInfoEnteredData {
  orderId?: string;
  shippingMethod: string;
  shippingTier?: 'standard' | 'express' | 'overnight' | 'same_day' | 'pickup' | 'free';
  total?: number;
  shippingCost?: number;
  currency?: CurrencyCode;
  products?: Product[];
  estimatedDelivery?: Timestamp;
  country?: string;
  postalCode?: string;
}
export interface PromotionViewedData {
  promotion: Promotion;
}
export interface PromotionClickedData {
  promotion: Promotion;
}

// ---- Subscription events ----

export interface SubscriptionCreatedData {
  planId: string;
  planName?: string;
  interval?: 'monthly' | 'yearly' | 'weekly' | 'custom';
  amount?: number;
  currency?: string;
  trialDays?: number;
}

export interface SubscriptionTrialStartedData {
  planId: string;
  planName?: string;
  trialDays: number;
  trialEndDate?: string;
}

export interface SubscriptionTrialEndedData {
  planId: string;
  planName?: string;
  converted: boolean;
  endReason?: 'expired' | 'converted' | 'cancelled';
}

export interface SubscriptionActivatedData {
  subscriptionId: string;
  planId: string;
  planName?: string;
  amount?: number;
  currency?: string;
  interval?: string;
}

export interface SubscriptionUpgradedData {
  subscriptionId: string;
  previousPlanId: string;
  previousPlanName?: string;
  newPlanId: string;
  newPlanName?: string;
  previousAmount?: number;
  newAmount?: number;
  currency?: string;
  prorated?: boolean;
}

export interface SubscriptionDowngradedData {
  subscriptionId: string;
  previousPlanId: string;
  previousPlanName?: string;
  newPlanId: string;
  newPlanName?: string;
  previousAmount?: number;
  newAmount?: number;
  currency?: string;
  effectiveDate?: string;
}

export interface SubscriptionRenewedData {
  subscriptionId: string;
  planId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  renewalCount?: number;
}

export interface SubscriptionCancelledData {
  subscriptionId: string;
  planId?: string;
  planName?: string;
  reason?: string;
  feedback?: string;
  effectiveDate?: string;
  willExpireAt?: string;
}

export interface SubscriptionPausedData {
  subscriptionId: string;
  planId?: string;
  reason?: string;
  resumeDate?: string;
}

export interface SubscriptionResumedData {
  subscriptionId: string;
  planId?: string;
  pauseDuration?: number;
}

export interface SubscriptionPaymentFailedData {
  subscriptionId: string;
  planId?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
  retryDate?: string;
  attemptCount?: number;
}

// ---- Payment events ----

export interface PaymentFailedData {
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod?:
    | 'credit_card'
    | 'debit_card'
    | 'bank_transfer'
    | 'paypal'
    | 'apple_pay'
    | 'google_pay'
    | 'crypto'
    | 'other';
  failureReason?:
    | 'insufficient_funds'
    | 'card_declined'
    | 'expired_card'
    | 'fraud_detected'
    | 'processing_error'
    | 'authentication_failed'
    | 'other';
  orderId?: string;
  invoiceId?: string;
  retryCount?: number;
}

export interface PaymentMethodAddedData {
  methodType: 'credit_card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  isDefault?: boolean;
}

export interface PaymentMethodRemovedData {
  methodType: string;
  last4?: string;
}

export interface PaymentMethodUpdatedData {
  methodType: string;
  updatedFields?: string[];
}

export interface PaymentInvoiceCreatedData {
  invoiceId: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
}

export interface PaymentInvoicePaidData {
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface PaymentInvoiceOverdueData {
  invoiceId: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  daysOverdue?: number;
}

export interface PaymentPayoutInitiatedData {
  payoutId: string;
  amount: number;
  currency?: string;
  destination?: string;
  method?: string;
}

export interface PaymentPayoutCompletedData {
  payoutId: string;
  amount: number;
  currency?: string;
  destination?: string;
  completedAt?: string;
}

// ---- Experiment events ----

export interface ExperimentExposureData {
  experimentId: string;
  experimentName?: string;
  variantId: string;
  variantName?: string;
  isControl?: boolean;
}

export interface ExperimentVariantAssignedData {
  experimentId: string;
  experimentName?: string;
  variantId: string;
  variantName?: string;
  assignmentMethod?: 'random' | 'targeted' | 'override';
}

export interface ExperimentConversionData {
  experimentId: string;
  experimentName?: string;
  variantId: string;
  variantName?: string;
  goalId?: string;
  goalName?: string;
  value?: number;
}

export interface ExperimentFeatureFlagEvaluatedData {
  flagKey: string;
  flagValue?: unknown;
  enabled: boolean;
  reason?: 'match' | 'default' | 'error' | 'override';
}

// ---- Auth events ----

export interface AuthLoginFailedData {
  method: 'password' | 'sso' | 'social' | 'magic_link' | 'biometric' | 'passkey' | 'other';
  failureReason:
    | 'invalid_credentials'
    | 'account_locked'
    | 'account_suspended'
    | 'mfa_required'
    | 'mfa_failed'
    | 'expired_password'
    | 'ip_blocked'
    | 'rate_limited'
    | 'other';
  userId?: string;
  email?: string;
  attemptCount?: number;
  ipAddress?: string;
}

export interface AuthPasswordResetRequestedData {
  method?: 'email' | 'sms' | 'security_question';
}

export interface AuthPasswordResetCompletedData {
  method?: string;
}

export interface AuthMfaEnabledData {
  method: 'totp' | 'sms' | 'email' | 'hardware_key' | 'push';
  userId?: string;
}

export interface AuthMfaDisabledData {
  method: string;
  userId?: string;
}

export interface AuthMfaChallengedData {
  method: string;
  challengeType?: 'login' | 'sensitive_action' | 'step_up';
}

export interface AuthMfaCompletedData {
  method: string;
  success: boolean;
  challengeType?: string;
}

export interface AuthSessionExpiredData {
  reason?: 'timeout' | 'revoked' | 'password_change' | 'forced';
  sessionDuration?: number;
}

export interface AuthTokenRefreshedData {
  tokenType?: 'access' | 'refresh' | 'id';
  expiresIn?: number;
}

// ---- Onboarding events ----

export interface OnboardingStartedData {
  flowId: string;
  flowName?: string;
  totalSteps?: number;
}

export interface OnboardingStepCompletedData {
  flowId: string;
  step: number;
  stepName?: string;
  totalSteps?: number;
  duration?: number;
}

export interface OnboardingStepSkippedData {
  flowId: string;
  step: number;
  stepName?: string;
}

export interface OnboardingCompletedData {
  flowId: string;
  flowName?: string;
  totalDuration?: number;
  stepsCompleted?: number;
  stepsSkipped?: number;
}

export interface OnboardingAbandonedData {
  flowId: string;
  lastStep?: number;
  lastStepName?: string;
  stepsCompleted?: number;
  duration?: number;
}

export interface OnboardingTourStartedData {
  tourId: string;
  tourName?: string;
  trigger?: 'auto' | 'manual' | 'contextual';
}

export interface OnboardingTourCompletedData {
  tourId: string;
  tourName?: string;
  stepsViewed?: number;
  totalSteps?: number;
}

export interface OnboardingChecklistItemCompletedData {
  checklistId: string;
  itemId: string;
  itemName?: string;
  completedCount?: number;
  totalItems?: number;
}

// ---- Notification events ----

export interface NotificationSentData {
  notificationId: string;
  channel: 'push' | 'in_app' | 'email' | 'sms' | 'webhook';
  title?: string;
  campaignId?: string;
}

export interface NotificationDeliveredData {
  notificationId: string;
  channel: string;
  deliveredAt?: string;
}

export interface NotificationOpenedData {
  notificationId: string;
  channel: string;
  title?: string;
  campaignId?: string;
  timeSinceSent?: number;
}

export interface NotificationClickedData {
  notificationId: string;
  channel: string;
  actionId?: string;
  actionUrl?: string;
  campaignId?: string;
}

export interface NotificationDismissedData {
  notificationId: string;
  channel: string;
  reason?: 'user' | 'timeout' | 'replaced';
}

export interface NotificationPermissionRequestedData {
  channel: string;
  trigger?: 'app_start' | 'contextual' | 'settings';
}

export interface NotificationPermissionGrantedData {
  channel: string;
}

export interface NotificationPermissionDeniedData {
  channel: string;
  isPermanent?: boolean;
}

// ---- Social events ----

export interface SocialFollowData {
  targetUserId: string;
  targetUserName?: string;
  source?: 'profile' | 'suggestion' | 'search' | 'content';
}

export interface SocialUnfollowData {
  targetUserId: string;
  targetUserName?: string;
  reason?: string;
}

export interface SocialLikeData {
  contentId: string;
  contentType?: 'post' | 'comment' | 'article' | 'product' | 'review' | 'other';
}

export interface SocialUnlikeData {
  contentId: string;
  contentType?: string;
}

export interface SocialCommentPostedData {
  contentId: string;
  contentType?: string;
  commentId?: string;
  parentCommentId?: string;
  isReply?: boolean;
}

export interface SocialCommentDeletedData {
  commentId: string;
  contentId?: string;
  reason?: 'user' | 'moderation' | 'policy';
}

export interface SocialPostCreatedData {
  postId: string;
  postType?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'story';
  hasMedia?: boolean;
  visibility?: 'public' | 'private' | 'followers' | 'group';
}

export interface SocialPostDeletedData {
  postId: string;
  reason?: 'user' | 'moderation' | 'policy';
}

export interface SocialReactionAddedData {
  contentId: string;
  contentType?: string;
  reactionType: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

export interface SocialReactionRemovedData {
  contentId: string;
  contentType?: string;
  reactionType: string;
}

// ---- Content events ----

export interface ContentViewedData {
  contentId: string;
  contentType?: 'article' | 'blog' | 'page' | 'documentation' | 'video' | 'podcast' | 'other';
  title?: string;
  author?: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
  readTime?: number;
}

export interface ContentCreatedData {
  contentId: string;
  contentType?: string;
  title?: string;
  author?: string;
  category?: string;
  status?: 'draft' | 'review' | 'published';
}

export interface ContentUpdatedData {
  contentId: string;
  contentType?: string;
  title?: string;
  updatedFields?: string[];
  version?: number;
}

export interface ContentDeletedData {
  contentId: string;
  contentType?: string;
  title?: string;
  reason?: string;
}

export interface ContentDraftedData {
  contentId: string;
  contentType?: 'article' | 'post' | 'page' | 'email' | 'document' | 'template' | 'other';
  title?: string;
  authorId?: string;
  wordCount?: number;
  isAutoSaved?: boolean;
}

export interface ContentPublishedData {
  contentId: string;
  contentType?: string;
  title?: string;
  author?: string;
  category?: string;
  publishedAt?: string;
}

export interface ContentArchivedData {
  contentId: string;
  contentType?: string;
  title?: string;
  reason?: string;
}

export interface ContentRatedData {
  contentId: string;
  contentType?: string;
  rating: number;
  maxRating?: number;
  ratingType?: 'stars' | 'thumbs' | 'numeric' | 'emoji';
}

export interface ContentBookmarkedData {
  contentId: string;
  contentType?: string;
  title?: string;
  collectionId?: string;
  collectionName?: string;
}

export interface ContentSharedData {
  contentId: string;
  contentType?: string;
  title?: string;
  method?: 'email' | 'social' | 'copy_link' | 'embed' | 'messaging';
  destination?: string;
}

// ---- Review events ----

export interface ReviewSubmittedData {
  targetId: string;
  targetType?: 'product' | 'service' | 'business' | 'app' | 'course' | 'other';
  reviewId?: string;
  rating: number;
  maxRating?: number;
  hasText?: boolean;
  hasMedia?: boolean;
  isVerifiedPurchase?: boolean;
}

export interface ReviewUpdatedData {
  reviewId: string;
  targetId?: string;
  previousRating?: number;
  newRating: number;
}

export interface ReviewDeletedData {
  reviewId: string;
  targetId?: string;
  reason?: 'user' | 'moderation' | 'policy';
}

export interface ReviewHelpfulMarkedData {
  reviewId: string;
  targetId?: string;
  isHelpful: boolean;
}

export interface ReviewReportedData {
  reviewId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
}

// ---- Referral events ----

export interface ReferralLinkCreatedData {
  referralId: string;
  programId?: string;
  programName?: string;
  channel?: string;
}

export interface ReferralLinkSharedData {
  referralId: string;
  method?: 'email' | 'social' | 'copy_link' | 'sms' | 'messaging';
  channel?: string;
}

export interface ReferralInviteSentData {
  referralId: string;
  method: string;
  programId?: string;
}

export interface ReferralInviteAcceptedData {
  referralId: string;
  referrerId?: string;
  programId?: string;
}

export interface ReferralRewardEarnedData {
  referralId: string;
  rewardType: 'credit' | 'discount' | 'cash' | 'points' | 'free_month' | 'other';
  rewardValue?: number;
  currency?: string;
  programId?: string;
}

// ---- Support events ----

export interface SupportTicketCreatedData {
  ticketId: string;
  subject?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channel?: 'web' | 'email' | 'phone' | 'chat' | 'social';
}

export interface SupportTicketUpdatedData {
  ticketId: string;
  status?: 'open' | 'in_progress' | 'waiting' | 'escalated' | 'resolved' | 'closed';
  previousStatus?: string;
  assigneeId?: string;
}

export interface SupportTicketEscalatedData {
  ticketId: string;
  previousTier?: string;
  newTier: string;
  escalatedBy?: 'agent' | 'system' | 'customer';
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
}

export interface SupportTicketResolvedData {
  ticketId: string;
  resolution?: 'solved' | 'closed' | 'duplicate' | 'wont_fix' | 'auto_resolved';
  resolutionTime?: number;
  responseCount?: number;
}

export interface SupportChatStartedData {
  chatId: string;
  channel?: 'live_chat' | 'chatbot' | 'messaging';
  topic?: string;
  isProactive?: boolean;
}

export interface SupportChatEndedData {
  chatId: string;
  duration?: number;
  messageCount?: number;
  resolved?: boolean;
  endedBy?: 'user' | 'agent' | 'system';
}

export interface SupportFeedbackSubmittedData {
  type: 'csat' | 'nps' | 'ces' | 'general' | 'bug_report' | 'feature_request';
  feedbackId?: string;
  score?: number;
  maxScore?: number;
  hasComment?: boolean;
  channel?: string;
}

export interface SupportRatingGivenData {
  targetId: string;
  targetType: 'agent' | 'interaction' | 'article' | 'resolution';
  rating: number;
  maxRating?: number;
}

export interface SupportArticleViewedData {
  articleId: string;
  articleTitle?: string;
  category?: string;
  source?: 'search' | 'browse' | 'suggestion' | 'ticket';
}

export interface SupportArticleHelpfulData {
  articleId: string;
  isHelpful: boolean;
  feedbackText?: string;
}

// ---- Communication events ----

export interface CommunicationMessageSentData {
  channel: 'chat' | 'messaging' | 'in_app';
  messageId?: string;
  conversationId?: string;
  hasAttachment?: boolean;
  hasMedia?: boolean;
}

export interface CommunicationMessageReceivedData {
  channel: string;
  messageId?: string;
  conversationId?: string;
  senderId?: string;
}

export interface CommunicationMessageReadData {
  messageId: string;
  channel?: string;
  conversationId?: string;
  timeSinceSent?: number;
}

export interface CommunicationEmailSentData {
  emailId?: string;
  templateId?: string;
  templateName?: string;
  campaignId?: string;
  subject?: string;
  recipientCount?: number;
}

export interface CommunicationEmailOpenedData {
  emailId: string;
  templateId?: string;
  campaignId?: string;
  timeSinceSent?: number;
}

export interface CommunicationEmailClickedData {
  emailId: string;
  linkUrl?: string;
  linkId?: string;
  campaignId?: string;
}

export interface CommunicationEmailBouncedData {
  emailId: string;
  bounceType?: 'hard' | 'soft' | 'block';
  reason?: string;
}

export interface CommunicationEmailUnsubscribedData {
  emailId?: string;
  listId?: string;
  listName?: string;
  reason?: string;
  campaignId?: string;
}

// ---- Scheduling events ----

export interface SchedulingAppointmentBookedData {
  appointmentId: string;
  startTime: string;
  appointmentType?: string;
  providerId?: string;
  providerName?: string;
  endTime?: string;
  duration?: number;
  location?: string;
  isVirtual?: boolean;
}

export interface SchedulingAppointmentCancelledData {
  appointmentId: string;
  reason?: string;
  cancelledBy?: 'user' | 'provider' | 'system';
  cancellationNotice?: number;
}

export interface SchedulingAppointmentRescheduledData {
  appointmentId: string;
  newStartTime: string;
  newEndTime?: string;
  previousStartTime?: string;
  rescheduledBy?: 'user' | 'provider' | 'system';
}

export interface SchedulingAppointmentCompletedData {
  appointmentId: string;
  appointmentType?: string;
  duration?: number;
  providerId?: string;
  noShow?: boolean;
}

export interface SchedulingReminderSentData {
  appointmentId: string;
  channel?: 'email' | 'sms' | 'push' | 'in_app';
  reminderType?: '1_day' | '1_hour' | '15_min' | 'custom';
  timeBefore?: number;
}

export interface SchedulingAvailabilityCheckedData {
  providerId?: string;
  providerType?: string;
  dateRange?: string;
  slotsAvailable?: number;
  slotsViewed?: number;
}

// ---- Search events ----

export interface SearchAutocompleteSelectedData {
  query: string;
  selectedText: string;
  selectedIndex?: number;
  totalSuggestions?: number;
  suggestionType?: 'recent' | 'popular' | 'product' | 'category' | 'keyword' | 'other';
  source?: string;
}

// ---- Marketplace events ----

export interface MarketplaceListingCreatedData {
  listingId: string;
  title?: string;
  category?: string;
  price?: number;
  currency?: string;
  sellerId?: string;
  condition?: 'new' | 'used' | 'refurbished' | 'other';
}

export interface MarketplaceListingUpdatedData {
  listingId: string;
  updatedFields?: string[];
  previousPrice?: number;
  newPrice?: number;
}

export interface MarketplaceListingPublishedData {
  listingId: string;
  title?: string;
  category?: string;
  price?: number;
  currency?: string;
}

export interface MarketplaceListingRemovedData {
  listingId: string;
  reason?: 'sold' | 'expired' | 'user' | 'policy' | 'other';
}

export interface MarketplaceOfferMadeData {
  offerId: string;
  listingId: string;
  amount: number;
  currency?: string;
  message?: string;
  expiresAt?: string;
}

export interface MarketplaceOfferAcceptedData {
  offerId: string;
  listingId: string;
  amount: number;
  currency?: string;
}

export interface MarketplaceOfferRejectedData {
  offerId: string;
  listingId: string;
  reason?: string;
}

export interface MarketplaceSellerContactedData {
  listingId: string;
  sellerId?: string;
  method?: 'message' | 'email' | 'phone' | 'chat';
  subject?: string;
}

export interface MarketplaceDisputeOpenedData {
  disputeId: string;
  orderId?: string;
  listingId?: string;
  reason:
    | 'item_not_received'
    | 'item_not_as_described'
    | 'unauthorized_purchase'
    | 'billing_error'
    | 'quality_issue'
    | 'counterfeit'
    | 'other';
  disputeType?: 'refund' | 'replacement' | 'mediation' | 'chargeback';
  amount?: number;
  currency?: string;
  initiatedBy?: 'buyer' | 'seller' | 'platform';
  description?: string;
}

export interface MarketplaceDisputeResolvedData {
  disputeId: string;
  orderId?: string;
  resolution: 'refunded' | 'replaced' | 'dismissed' | 'escalated' | 'partial_refund' | 'mediated';
  resolvedBy?: 'buyer' | 'seller' | 'platform' | 'automatic';
  resolutionAmount?: number;
  currency?: string;
  durationSeconds?: number;
}

// ---- Education events ----

export interface EducationCourseEnrolledData {
  courseId: string;
  courseName?: string;
  instructorId?: string;
  instructorName?: string;
  enrollmentType?: 'free' | 'paid' | 'trial' | 'scholarship';
  price?: number;
  currency?: string;
}

export interface EducationCourseStartedData {
  courseId: string;
  courseName?: string;
  totalLessons?: number;
  totalDuration?: number;
}

export interface EducationCourseCompletedData {
  courseId: string;
  courseName?: string;
  completionTime?: number;
  lessonsCompleted?: number;
  finalScore?: number;
  certificateEarned?: boolean;
}

export interface EducationLessonStartedData {
  lessonId: string;
  lessonName?: string;
  courseId?: string;
  lessonNumber?: number;
  lessonType?: 'video' | 'text' | 'interactive' | 'quiz' | 'assignment' | 'live';
}

export interface EducationLessonCompletedData {
  lessonId: string;
  lessonName?: string;
  courseId?: string;
  duration?: number;
  score?: number;
  passed?: boolean;
}

export interface EducationQuizStartedData {
  quizId: string;
  quizName?: string;
  courseId?: string;
  lessonId?: string;
  questionCount?: number;
  timeLimit?: number;
  attemptNumber?: number;
}

export interface EducationQuizCompletedData {
  quizId: string;
  score: number;
  quizName?: string;
  courseId?: string;
  maxScore?: number;
  passed?: boolean;
  duration?: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface EducationCertificateEarnedData {
  certificateId: string;
  courseId: string;
  courseName?: string;
  issuedAt?: string;
  expiresAt?: string;
  credentialUrl?: string;
}

// ---- Gaming events ----

export interface GamingLevelStartedData {
  levelId: string;
  levelName?: string;
  levelNumber?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  attempts?: number;
}

export interface GamingLevelCompletedData {
  levelId: string;
  levelName?: string;
  levelNumber?: number;
  score?: number;
  stars?: number;
  duration?: number;
  isFirstCompletion?: boolean;
  isPerfect?: boolean;
}

export interface GamingAchievementUnlockedData {
  achievementId: string;
  achievementName?: string;
  category?: string;
  points?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isSecret?: boolean;
}

export interface GamingItemAcquiredData {
  itemId: string;
  itemName?: string;
  itemType?: 'weapon' | 'armor' | 'consumable' | 'cosmetic' | 'currency' | 'material' | 'other';
  rarity?: string;
  source?: 'purchase' | 'drop' | 'reward' | 'craft' | 'trade' | 'gift';
  quantity?: number;
  virtualCurrencyCost?: number;
  realCurrencyCost?: number;
  currency?: string;
}

export interface GamingItemUsedData {
  itemId: string;
  itemName?: string;
  itemType?: string;
  context?: string;
  quantity?: number;
}

export interface GamingCurrencyEarnedData {
  currencyName: string;
  amount: number;
  source?:
    | 'purchase'
    | 'reward'
    | 'quest'
    | 'daily_login'
    | 'achievement'
    | 'referral'
    | 'promotion'
    | 'other';
  balance?: number;
  level?: number;
  gameMode?: string;
}

export interface GamingCurrencySpentData {
  currencyName: string;
  amount: number;
  itemName?: string;
  itemCategory?: string;
  balance?: number;
  level?: number;
  gameMode?: string;
}

export interface GamingScorePostedData {
  score: number;
  leaderboardId?: string;
  leaderboardName?: string;
  rank?: number;
  levelId?: string;
  isPersonalBest?: boolean;
}

export interface GamingChallengeStartedData {
  challengeId: string;
  challengeName?: string;
  challengeType?: 'daily' | 'weekly' | 'seasonal' | 'special' | 'pvp' | 'pve';
  difficulty?: string;
}

export interface GamingChallengeCompletedData {
  challengeId: string;
  challengeName?: string;
  challengeType?: string;
  score?: number;
  reward?: string;
  duration?: number;
  isFirstCompletion?: boolean;
}

// ---- CRM events ----

export interface CrmLeadCreatedData {
  leadId: string;
  source?: 'organic' | 'paid' | 'referral' | 'social' | 'email' | 'partner' | 'event' | 'other';
  channel?: string;
  campaignId?: string;
  score?: number;
}

export interface CrmLeadQualifiedData {
  leadId: string;
  qualificationType?: 'mql' | 'sql' | 'pql' | 'manual';
  score?: number;
  criteria?: string[];
}

export interface CrmLeadConvertedData {
  leadId: string;
  convertedTo?: 'opportunity' | 'customer' | 'account';
  conversionValue?: number;
  currency?: string;
  timeToConvert?: number;
}

export interface CrmOpportunityCreatedData {
  opportunityId: string;
  name?: string;
  stage?: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  ownerId?: string;
}

export interface CrmOpportunityUpdatedData {
  opportunityId: string;
  previousStage?: string;
  newStage?: string;
  previousValue?: number;
  newValue?: number;
  updatedFields?: string[];
}

export interface CrmOpportunityWonData {
  opportunityId: string;
  value: number;
  currency?: string;
  timeToClose?: number;
  products?: CrmDealProduct[];
}

export interface CrmOpportunityLostData {
  opportunityId: string;
  value?: number;
  currency?: string;
  reason?: 'price' | 'competitor' | 'timing' | 'no_budget' | 'no_need' | 'no_response' | 'other';
  competitor?: string;
  timeToLose?: number;
}

export interface CrmDemoRequestedData {
  demoId?: string;
  leadId?: string;
  product?: string;
  preferredDate?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
}

export interface CrmDemoScheduledData {
  demoId: string;
  scheduledAt: string;
  leadId?: string;
  duration?: number;
  product?: string;
  presenterId?: string;
}

export interface CrmDemoCompletedData {
  demoId: string;
  leadId?: string;
  duration?: number;
  attendeeCount?: number;
  outcome?: 'interested' | 'not_interested' | 'follow_up' | 'deal_created';
  followUpDate?: string;
}

export interface CrmContractSentData {
  contractId: string;
  opportunityId?: string;
  value?: number;
  currency?: string;
  expiresAt?: string;
}

export interface CrmContractSignedData {
  contractId: string;
  value: number;
  opportunityId?: string;
  currency?: string;
  signedAt?: string;
  termLength?: number;
}

// ---- App lifecycle events ----

export interface AppInstalledData {
  version?: string;
  platform?: 'ios' | 'android' | 'web' | 'desktop';
  source?: 'app_store' | 'play_store' | 'direct' | 'referral' | 'ad';
  campaignId?: string;
}

export interface AppOpenedData {
  version?: string;
  isFirstOpen?: boolean;
  openedFrom?: 'direct' | 'push_notification' | 'deep_link' | 'widget' | 'shortcut';
  referringUrl?: string;
}

export interface AppBackgroundedData {
  sessionDuration?: number;
  screenName?: string;
}

export interface AppForegroundedData {
  backgroundDuration?: number;
  screenName?: string;
}

export interface AppUpdatedData {
  previousVersion: string;
  newVersion: string;
  updateMethod?: 'auto' | 'manual' | 'forced';
}

export interface AppCrashedData {
  message: string;
  stackTrace?: string;
  screenName?: string;
  isFatal?: boolean;
  appVersion?: string;
  osVersion?: string;
}

export interface AppDeepLinkOpenedData {
  url: string;
  source?: string;
  campaignId?: string;
  isDeferred?: boolean;
  matchType?: 'exact' | 'fingerprint' | 'default';
}

export interface AppScreenViewedData {
  screenName: string;
  screenClass?: string;
  previousScreenName?: string;
  previousScreenClass?: string;
}

export interface AppDeviceConnectedData {
  deviceId: string;
  deviceName?: string;
  deviceType?:
    | 'wearable'
    | 'smart_home'
    | 'sensor'
    | 'peripheral'
    | 'vehicle'
    | 'appliance'
    | 'other';
  connectionType?:
    | 'bluetooth'
    | 'wifi'
    | 'usb'
    | 'zigbee'
    | 'zwave'
    | 'thread'
    | 'matter'
    | 'cellular'
    | 'other';
  firmwareVersion?: string;
  manufacturer?: string;
  model?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface AppDeviceDisconnectedData {
  deviceId: string;
  deviceName?: string;
  deviceType?:
    | 'wearable'
    | 'smart_home'
    | 'sensor'
    | 'peripheral'
    | 'vehicle'
    | 'appliance'
    | 'other';
  reason?:
    | 'user_initiated'
    | 'timeout'
    | 'out_of_range'
    | 'low_battery'
    | 'error'
    | 'firmware_update'
    | 'other';
  sessionDurationSeconds?: number;
}

export interface AppDeviceFirmwareUpdatedData {
  deviceId: string;
  deviceName?: string;
  previousVersion?: string;
  newVersion: string;
  updateMethod?: 'ota' | 'usb' | 'manual' | 'automatic';
  durationSeconds?: number;
  status?: 'success' | 'failed' | 'partial';
}

// ---- Order events ----

export interface OrderConfirmedData {
  orderId: string;
  total?: number;
  currency?: string;
  estimatedDelivery?: string;
  products?: {
    id?: string;
    name?: string;
    quantity?: number;
    price?: number;
  }[];
  shippingMethod?: string;
  shippingAddress?: {
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface OrderProcessingData {
  orderId: string;
  status?: 'picking' | 'packing' | 'quality_check' | 'ready_to_ship';
  warehouseId?: string;
  estimatedShipDate?: string;
}

export interface OrderShippedData {
  orderId: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shipmentId?: string;
}

export interface OrderDeliveredData {
  orderId: string;
  deliveredAt?: string;
  signedBy?: string;
  deliveryMethod?: 'standard' | 'express' | 'same_day' | 'pickup' | 'locker';
  deliveryDuration?: number;
}

export interface OrderReturnRequestedData {
  orderId: string;
  reason?: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'too_late' | 'other';
  products?: {
    id?: string;
    name?: string;
    quantity?: number;
  }[];
  returnMethod?: 'mail' | 'in_store' | 'pickup';
  comments?: string;
}

export interface OrderReturnedData {
  orderId: string;
  refundAmount?: number;
  refundMethod?: 'original_payment' | 'store_credit' | 'exchange';
  products?: {
    id?: string;
    name?: string;
    quantity?: number;
  }[];
  returnId?: string;
}

export interface OrderCancelledData {
  orderId: string;
  reason?: 'customer_request' | 'out_of_stock' | 'payment_failed' | 'fraud_detected' | 'other';
  cancelledBy?: 'customer' | 'merchant' | 'system';
  refundAmount?: number;
  currency?: string;
}

// ---- Account events ----

export interface AccountCreatedData {
  accountId: string;
  accountName?: string;
  plan?: string;
  accountType?: 'personal' | 'team' | 'enterprise';
  createdBy?: string;
}

export interface AccountSuspendedData {
  accountId: string;
  reason?: 'billing_failure' | 'terms_violation' | 'inactivity' | 'security' | 'manual';
  suspendedBy?: 'system' | 'admin';
}

export interface AccountReactivatedData {
  accountId: string;
  previousStatus?: 'suspended' | 'cancelled' | 'expired';
  reactivatedBy?: 'customer' | 'admin' | 'system';
}

export interface AccountDeletedData {
  accountId: string;
  reason?: 'customer_request' | 'inactivity' | 'terms_violation' | 'other';
  deletedBy?: 'customer' | 'admin' | 'system';
  retentionDays?: number;
}

export interface AccountSettingsUpdatedData {
  accountId: string;
  updatedFields?: string[];
  category?: 'billing' | 'security' | 'notifications' | 'preferences' | 'branding' | 'other';
}

export interface AccountTeamMemberAddedData {
  accountId: string;
  memberId?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer' | 'billing';
  inviteMethod?: 'email' | 'link' | 'sso' | 'api';
}

export interface AccountSeatAddedData {
  accountId: string;
  seatId?: string;
  userId?: string;
  role?: string;
  licenseType?: string;
  totalSeats?: number;
  usedSeats?: number;
  plan?: string;
}

export interface AccountSeatRemovedData {
  accountId: string;
  seatId?: string;
  userId?: string;
  reason?: 'offboarding' | 'downgrade' | 'cost_reduction' | 'inactivity' | 'other';
  totalSeats?: number;
  usedSeats?: number;
  plan?: string;
}

// ---- Privacy events ----

export interface PrivacyDataExportRequestedData {
  requestId: string;
  userId?: string;
  dataTypes?: string[];
  format?: 'json' | 'csv' | 'xml';
  regulation?: 'gdpr' | 'ccpa' | 'lgpd' | 'other';
}

export interface PrivacyDataExportCompletedData {
  requestId: string;
  userId?: string;
  format?: 'json' | 'csv' | 'xml';
  fileSize?: number;
  recordCount?: number;
  duration?: number;
}

export interface PrivacyDataDeletionRequestedData {
  requestId: string;
  userId?: string;
  scope?: 'full' | 'partial';
  dataTypes?: string[];
  regulation?: 'gdpr' | 'ccpa' | 'lgpd' | 'other';
  scheduledAt?: string;
}

export interface PrivacyDataDeletionCompletedData {
  requestId: string;
  userId?: string;
  scope?: 'full' | 'partial';
  recordsDeleted?: number;
  duration?: number;
}

export interface PrivacyConsentRecordCreatedData {
  consentId: string;
  userId?: string;
  purposes?: Record<string, unknown>;
  regulation?: 'gdpr' | 'ccpa' | 'lgpd' | 'other';
  source?: 'banner' | 'preference_center' | 'api' | 'registration' | 'checkout';
  ipAddress?: string;
  userAgent?: string;
}

// ---- Feature events ----

export interface FeatureUsedData {
  featureName: string;
  featureId?: string;
  module?: string;
  action?: string;
  usageCount?: number;
  metadata?: Record<string, unknown>;
}

export interface FeatureActivatedData {
  featureName: string;
  featureId?: string;
  method?: 'self_service' | 'admin' | 'api' | 'upgrade' | 'trial';
  plan?: string;
}

export interface FeatureDeactivatedData {
  featureName: string;
  featureId?: string;
  reason?: 'downgrade' | 'manual' | 'expired' | 'limit_reached' | 'admin';
  plan?: string;
}

export interface FeatureTrialStartedData {
  featureName: string;
  featureId?: string;
  trialDays?: number;
  trialEnd?: string;
  plan?: string;
}

export interface FeatureLimitReachedData {
  featureName: string;
  featureId?: string;
  limitType?: 'usage' | 'storage' | 'seats' | 'api_calls' | 'bandwidth' | 'other';
  currentUsage?: number;
  limit?: number;
  unit?: string;
  percentUsed?: number;
}

// ---- Loyalty events ----

export interface LoyaltyProgramJoinedData {
  programId: string;
  programName?: string;
  tier?: string;
  memberId?: string;
  joinMethod?: 'signup' | 'purchase' | 'referral' | 'promotion' | 'auto';
}

export interface LoyaltyPointsEarnedData {
  points: number;
  programId?: string;
  reason?:
    | 'purchase'
    | 'referral'
    | 'review'
    | 'engagement'
    | 'promotion'
    | 'birthday'
    | 'signup'
    | 'other';
  orderId?: string;
  balance?: number;
}

export interface LoyaltyPointsExpiredData {
  programId: string;
  memberId?: string;
  points: number;
  expiredAt?: string;
  reason?: 'inactivity' | 'time_limit' | 'program_change' | 'other';
}

export interface LoyaltyPointsRedeemedData {
  points: number;
  programId?: string;
  rewardType?: 'discount' | 'product' | 'gift_card' | 'experience' | 'shipping' | 'other';
  rewardName?: string;
  rewardValue?: number;
  orderId?: string;
  balance?: number;
}

export interface LoyaltyTierUpgradedData {
  programId: string;
  previousTier: string;
  newTier: string;
  memberId?: string;
  qualifyingPoints?: number;
  qualifyingSpend?: number;
}

export interface LoyaltyTierDowngradedData {
  programId: string;
  previousTier: string;
  newTier: string;
  memberId?: string;
  reason?: 'insufficient_activity' | 'expiration' | 'manual' | 'other';
}

export interface LoyaltyRewardClaimedData {
  rewardId: string;
  programId?: string;
  rewardName?: string;
  rewardType?: 'discount' | 'product' | 'gift_card' | 'experience' | 'shipping' | 'other';
  rewardValue?: number;
  pointsCost?: number;
}

// ---- Survey events ----

export interface SurveyStartedData {
  surveyId: string;
  surveyName?: string;
  surveyType?: 'nps' | 'csat' | 'ces' | 'feedback' | 'poll' | 'research' | 'other';
  totalQuestions?: number;
  trigger?: 'in_app' | 'email' | 'post_purchase' | 'post_support' | 'scheduled' | 'manual';
}

export interface SurveyCompletedData {
  surveyId: string;
  surveyName?: string;
  surveyType?: 'nps' | 'csat' | 'ces' | 'feedback' | 'poll' | 'research' | 'other';
  duration?: number;
  questionsAnswered?: number;
  totalQuestions?: number;
}

export interface SurveyAbandonedData {
  surveyId: string;
  surveyName?: string;
  lastQuestionIndex?: number;
  questionsAnswered?: number;
  totalQuestions?: number;
  duration?: number;
}

export interface SurveyQuestionAnsweredData {
  surveyId: string;
  questionIndex: number;
  questionId?: string;
  questionType?:
    | 'multiple_choice'
    | 'single_choice'
    | 'text'
    | 'rating'
    | 'scale'
    | 'matrix'
    | 'ranking'
    | 'other';
  questionText?: string;
  answerValue?: string;
  answerNumeric?: number;
}

export interface SurveyNpsSubmittedData {
  surveyId: string;
  score: number;
  comment?: string;
  category?: 'promoter' | 'passive' | 'detractor';
  touchpoint?: 'product' | 'support' | 'onboarding' | 'checkout' | 'general' | 'other';
}

// ---- Collaboration events ----

export interface CollaborationWorkspaceCreatedData {
  workspaceId: string;
  workspaceName?: string;
  workspaceType?: 'team' | 'project' | 'department' | 'personal' | 'other';
  createdBy?: string;
}

export interface CollaborationMemberInvitedData {
  workspaceId: string;
  inviteeId?: string;
  role?: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter' | 'guest';
  inviteMethod?: 'email' | 'link' | 'sso' | 'api';
}

export interface CollaborationMemberJoinedData {
  workspaceId: string;
  memberId?: string;
  role?: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter' | 'guest';
  joinMethod?: 'invite' | 'link' | 'sso' | 'auto';
}

export interface CollaborationMemberRemovedData {
  workspaceId: string;
  memberId?: string;
  role?: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter' | 'guest';
  removedBy?: 'admin' | 'self' | 'system';
  reason?: 'offboarding' | 'access_review' | 'request' | 'inactivity' | 'other';
}

export interface CollaborationRoleChangedData {
  workspaceId: string;
  previousRole: string;
  newRole: string;
  memberId?: string;
  changedBy?: string;
}

export interface CollaborationItemSharedData {
  itemId: string;
  itemType?: 'document' | 'file' | 'folder' | 'project' | 'board' | 'page' | 'other';
  workspaceId?: string;
  shareType?: 'internal' | 'external' | 'public' | 'link';
  recipientCount?: number;
}

export interface CollaborationItemCommentedData {
  itemId: string;
  commentId?: string;
  itemType?: 'document' | 'file' | 'folder' | 'project' | 'board' | 'page' | 'other';
  workspaceId?: string;
  isReply?: boolean;
  parentCommentId?: string;
}

export interface CollaborationTaskCreatedData {
  taskId: string;
  workspaceId?: string;
  projectId?: string;
  title?: string;
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  dueDate?: string;
  labels?: string[];
}

export interface CollaborationTaskCompletedData {
  taskId: string;
  workspaceId?: string;
  projectId?: string;
  completedBy?: string;
  duration?: number;
  wasOverdue?: boolean;
}

// ---- Video call events ----

export interface VideoCallStartedData {
  callId: string;
  callType?: 'one_on_one' | 'group' | 'webinar' | 'broadcast';
  provider?: 'zoom' | 'teams' | 'meet' | 'webex' | 'custom' | 'other';
  scheduledStart?: string;
  hostId?: string;
  isScheduled?: boolean;
}

export interface VideoCallJoinedData {
  callId: string;
  participantId?: string;
  joinMethod?: 'link' | 'app' | 'phone' | 'browser' | 'dial_in';
  isHost?: boolean;
  participantCount?: number;
}

export interface VideoCallLeftData {
  callId: string;
  participantId?: string;
  duration?: number;
  leaveReason?: 'ended' | 'hangup' | 'dropped' | 'kicked' | 'timeout';
}

export interface VideoCallEndedData {
  callId: string;
  duration?: number;
  participantCount?: number;
  maxParticipants?: number;
  hostId?: string;
}

export interface VideoCallRecordingStartedData {
  callId: string;
  recordingId?: string;
  initiatedBy?: string;
  recordingType?: 'cloud' | 'local' | 'transcript';
}

export interface VideoCallRecordingStoppedData {
  callId: string;
  recordingId: string;
  duration?: number;
  stoppedBy?: 'host' | 'system' | 'participant';
  fileSize?: number;
}

export interface VideoCallScreenSharedData {
  callId: string;
  participantId?: string;
  shareType?: 'screen' | 'window' | 'tab' | 'application';
  duration?: number;
}

// ---- Booking events ----

export interface BookingSearchInitiatedData {
  bookingType?: 'hotel' | 'flight' | 'restaurant' | 'rental_car' | 'activity' | 'event' | 'other';
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  resultCount?: number;
}

export interface BookingReservationCreatedData {
  reservationId: string;
  bookingType?: 'hotel' | 'flight' | 'restaurant' | 'rental_car' | 'activity' | 'event' | 'other';
  propertyName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  total?: number;
  currency?: string;
}

export interface BookingReservationConfirmedData {
  reservationId: string;
  confirmationCode?: string;
  bookingType?: 'hotel' | 'flight' | 'restaurant' | 'rental_car' | 'activity' | 'event' | 'other';
  total?: number;
  currency?: string;
}

export interface BookingReservationModifiedData {
  reservationId: string;
  modifiedFields?: string[];
  bookingType?: 'hotel' | 'flight' | 'restaurant' | 'rental_car' | 'activity' | 'event' | 'other';
  priceDifference?: number;
}

export interface BookingReservationCancelledData {
  reservationId: string;
  reason?: 'plans_changed' | 'found_better' | 'price' | 'weather' | 'illness' | 'work' | 'other';
  cancellationFee?: number;
  refundAmount?: number;
  currency?: string;
  cancelledBy?: 'customer' | 'provider' | 'system';
}

export interface BookingCheckInData {
  reservationId: string;
  checkInMethod?: 'online' | 'kiosk' | 'front_desk' | 'app' | 'auto';
  earlyCheckIn?: boolean;
  confirmationCode?: string;
}

export interface BookingCheckOutData {
  reservationId: string;
  checkOutMethod?: 'online' | 'kiosk' | 'front_desk' | 'app' | 'express';
  lateCheckOut?: boolean;
  finalTotal?: number;
  currency?: string;
  stayDuration?: number;
}

// ---- File events ----

export interface FileUploadedData {
  fileId: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  source?: 'local' | 'camera' | 'cloud' | 'drag_drop' | 'api' | 'other';
  destinationFolder?: string;
}

export interface FileDeletedData {
  fileId: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  deletedBy?: 'user' | 'system' | 'admin' | 'retention_policy';
  permanent?: boolean;
}

export interface FileDownloadedData {
  fileId: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  source?: string;
  downloadMethod?: 'direct' | 'api' | 'bulk' | 'export' | 'other';
}

export interface FilePreviewedData {
  fileId: string;
  fileName?: string;
  fileType?: string;
  previewType?: 'thumbnail' | 'full' | 'inline' | 'modal';
  duration?: number;
}

export interface FileConvertedData {
  fileId: string;
  fileName?: string;
  sourceFormat?: string;
  targetFormat?: string;
  fileSize?: number;
  duration?: number;
}

export interface FileVersionCreatedData {
  fileId: string;
  fileName?: string;
  versionNumber?: number;
  versionId?: string;
  previousVersionId?: string;
  changeDescription?: string;
  fileSize?: number;
}

// ---- Integration events ----

export interface IntegrationConnectedData {
  integrationId: string;
  integrationName?: string;
  provider?: string;
  category?:
    | 'crm'
    | 'marketing'
    | 'analytics'
    | 'payment'
    | 'communication'
    | 'storage'
    | 'productivity'
    | 'other';
  connectedBy?: 'user' | 'admin' | 'api' | 'oauth';
  scopes?: string[];
}

export interface IntegrationDisconnectedData {
  integrationId: string;
  integrationName?: string;
  provider?: string;
  reason?:
    | 'user_request'
    | 'token_expired'
    | 'error'
    | 'admin_action'
    | 'provider_revoked'
    | 'other';
  disconnectedBy?: 'user' | 'admin' | 'system' | 'provider';
}

export interface IntegrationSyncStartedData {
  integrationId: string;
  integrationName?: string;
  syncType?: 'full' | 'incremental' | 'manual' | 'scheduled';
  direction?: 'inbound' | 'outbound' | 'bidirectional';
  dataType?: string;
}

export interface IntegrationSyncCompletedData {
  integrationId: string;
  integrationName?: string;
  syncType?: 'full' | 'incremental' | 'manual' | 'scheduled';
  direction?: 'inbound' | 'outbound' | 'bidirectional';
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  duration?: number;
}

export interface IntegrationSyncFailedData {
  integrationId: string;
  integrationName?: string;
  syncType?: 'full' | 'incremental' | 'manual' | 'scheduled';
  errorMessage?: string;
  errorCode?: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  isRetryable?: boolean;
}

export interface IntegrationDeploymentStartedData {
  deploymentId: string;
  environment: 'production' | 'staging' | 'preview' | 'development' | 'test';
  commitSha?: string;
  branch?: string;
  version?: string;
  initiatedBy?: 'user' | 'ci' | 'rollback' | 'schedule';
  provider?: string;
  projectId?: string;
}

export interface IntegrationDeploymentCompletedData {
  deploymentId: string;
  environment: 'production' | 'staging' | 'preview' | 'development' | 'test';
  status: 'success' | 'failure' | 'cancelled' | 'rolled_back';
  commitSha?: string;
  branch?: string;
  version?: string;
  durationSeconds?: number;
  provider?: string;
  projectId?: string;
  url?: string;
}

// ---- Automation events ----

export interface AutomationWorkflowTriggeredData {
  workflowId: string;
  workflowName?: string;
  trigger?: 'event' | 'schedule' | 'manual' | 'webhook' | 'condition' | 'api';
  triggeredBy?: string;
  executionId?: string;
}

export interface AutomationWorkflowCompletedData {
  workflowId: string;
  workflowName?: string;
  executionId?: string;
  duration?: number;
  stepsCompleted?: number;
  totalSteps?: number;
  status?: 'success' | 'partial' | 'skipped';
}

export interface AutomationWorkflowFailedData {
  workflowId: string;
  workflowName?: string;
  executionId?: string;
  errorMessage?: string;
  failedStep?: string;
  stepsCompleted?: number;
  totalSteps?: number;
  isRetryable?: boolean;
}

export interface AutomationRuleCreatedData {
  ruleId: string;
  ruleName?: string;
  ruleType?: 'trigger' | 'condition' | 'action' | 'filter' | 'transformation';
  workflowId?: string;
  createdBy?: string;
}

export interface AutomationActionExecutedData {
  actionId: string;
  actionType?:
    | 'send_email'
    | 'send_notification'
    | 'update_record'
    | 'create_record'
    | 'webhook'
    | 'delay'
    | 'condition'
    | 'api_call'
    | 'other';
  workflowId?: string;
  executionId?: string;
  duration?: number;
  status?: 'success' | 'failed' | 'skipped';
}

// ---- Ad events ----

export interface AdImpressionData {
  adId: string;
  adName?: string;
  adType?: 'banner' | 'native' | 'video' | 'interstitial' | 'rewarded' | 'popup' | 'other';
  placement?: string;
  campaignId?: string;
  creativeId?: string;
  adSize?: string;
  adNetwork?: string;
  viewableTime?: number;
  viewablePercent?: number;
}

export interface AdClickedData {
  adId: string;
  adName?: string;
  adType?: 'banner' | 'native' | 'video' | 'interstitial' | 'rewarded' | 'popup' | 'other';
  placement?: string;
  campaignId?: string;
  creativeId?: string;
  destinationUrl?: string;
  adNetwork?: string;
}

export interface AdConversionData {
  adId: string;
  conversionType?: 'signup' | 'purchase' | 'lead' | 'install' | 'add_to_cart' | 'other';
  conversionValue?: number;
  currency?: string;
  campaignId?: string;
  creativeId?: string;
  attributionModel?:
    | 'last_click'
    | 'first_click'
    | 'linear'
    | 'time_decay'
    | 'position_based'
    | 'other';
}

export interface AdRevenueEarnedData {
  adId: string;
  revenue?: number;
  currency?: string;
  adType?: 'banner' | 'native' | 'video' | 'interstitial' | 'rewarded' | 'popup' | 'other';
  adNetwork?: string;
  placement?: string;
  ecpm?: number;
}

export interface AdBlockedData {
  adId: string;
  reason?:
    | 'ad_blocker'
    | 'user_preference'
    | 'policy_violation'
    | 'malware'
    | 'irrelevant'
    | 'reported'
    | 'other';
  adType?: 'banner' | 'native' | 'video' | 'interstitial' | 'rewarded' | 'popup' | 'other';
  adNetwork?: string;
  blockedBy?: 'user' | 'system' | 'browser' | 'extension';
}

// ---- Identity events ----

export interface IdentityVerificationStartedData {
  verificationId: string;
  verificationType?:
    | 'kyc'
    | 'kyb'
    | 'age'
    | 'address'
    | 'phone'
    | 'email'
    | 'document'
    | 'biometric'
    | 'other';
  provider?: string;
  userId?: string;
  tier?: 'basic' | 'standard' | 'enhanced';
}

export interface IdentityVerificationCompletedData {
  verificationId: string;
  verificationType?:
    | 'kyc'
    | 'kyb'
    | 'age'
    | 'address'
    | 'phone'
    | 'email'
    | 'document'
    | 'biometric'
    | 'other';
  provider?: string;
  userId?: string;
  result?: 'approved' | 'denied' | 'pending_review' | 'inconclusive';
  duration?: number;
  tier?: 'basic' | 'standard' | 'enhanced';
}

export interface IdentityVerificationFailedData {
  verificationId: string;
  verificationType?:
    | 'kyc'
    | 'kyb'
    | 'age'
    | 'address'
    | 'phone'
    | 'email'
    | 'document'
    | 'biometric'
    | 'other';
  provider?: string;
  userId?: string;
  reason?:
    | 'document_expired'
    | 'document_unreadable'
    | 'mismatch'
    | 'fraud_detected'
    | 'unsupported_document'
    | 'timeout'
    | 'technical_error'
    | 'other';
  canRetry?: boolean;
}

export interface IdentityDocumentSubmittedData {
  verificationId: string;
  documentType?:
    | 'passport'
    | 'drivers_license'
    | 'national_id'
    | 'utility_bill'
    | 'bank_statement'
    | 'tax_return'
    | 'selfie'
    | 'other';
  userId?: string;
  documentCountry?: string;
}

export interface IdentityDocumentApprovedData {
  verificationId: string;
  documentType?:
    | 'passport'
    | 'drivers_license'
    | 'national_id'
    | 'utility_bill'
    | 'bank_statement'
    | 'tax_return'
    | 'selfie'
    | 'other';
  userId?: string;
  confidenceScore?: number;
}

// ---- Document events ----

export interface DocumentCreatedData {
  documentId: string;
  documentName?: string;
  documentType?:
    | 'contract'
    | 'proposal'
    | 'invoice'
    | 'agreement'
    | 'nda'
    | 'sow'
    | 'report'
    | 'other';
  templateId?: string;
  createdBy?: string;
}

export interface DocumentSignedData {
  documentId: string;
  documentName?: string;
  signerId?: string;
  signerRole?: 'sender' | 'signer' | 'witness' | 'approver';
  signatureMethod?: 'electronic' | 'digital' | 'wet_ink' | 'biometric';
  signatureOrder?: number;
  allPartiesSigned?: boolean;
}

export interface DocumentSentData {
  documentId: string;
  documentName?: string;
  recipientCount?: number;
  sendMethod?: 'email' | 'link' | 'api' | 'in_app';
  expiresAt?: string;
}

export interface DocumentViewedData {
  documentId: string;
  documentName?: string;
  viewerId?: string;
  viewDuration?: number;
  pagesViewed?: number;
  totalPages?: number;
}

export interface DocumentExpiredData {
  documentId: string;
  documentName?: string;
  reason?: 'time_limit' | 'unsigned' | 'revoked' | 'superseded';
  originalDeadline?: string;
}

// ---- Finance events ----

export interface FinanceTransferInitiatedData {
  transferId: string;
  amount: number;
  currency?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transferType?: 'internal' | 'external' | 'p2p' | 'wire' | 'ach' | 'instant';
  provider?: string;
}

export interface FinanceTransferCompletedData {
  transferId: string;
  amount: number;
  currency?: string;
  fromAccountId?: string;
  toAccountId?: string;
  transferType?: 'internal' | 'external' | 'p2p' | 'wire' | 'ach' | 'instant';
  duration?: number;
  fee?: number;
}

export interface FinanceDepositMadeData {
  amount: number;
  accountId?: string;
  currency?: string;
  depositMethod?: 'bank_transfer' | 'card' | 'cash' | 'check' | 'crypto' | 'other';
  transactionId?: string;
}

export interface FinanceWithdrawalMadeData {
  amount: number;
  accountId?: string;
  currency?: string;
  withdrawalMethod?: 'bank_transfer' | 'atm' | 'cash' | 'check' | 'crypto' | 'other';
  transactionId?: string;
}

export interface FinanceWalletToppedUpData {
  amount: number;
  walletId?: string;
  currency?: string;
  topUpMethod?: 'bank_transfer' | 'card' | 'cash' | 'crypto' | 'reward' | 'other';
  balance?: number;
}

export interface FinanceBalanceCheckedData {
  accountId?: string;
  accountType?: 'checking' | 'savings' | 'wallet' | 'credit' | 'investment' | 'crypto' | 'other';
  balance?: number;
  currency?: CurrencyCode;
}

export interface FinanceStatementGeneratedData {
  statementId: string;
  accountId?: string;
  periodStart?: string;
  periodEnd?: string;
  format?: 'pdf' | 'csv' | 'html' | 'json';
  transactionCount?: number;
}

export interface FinanceTradeExecutedData {
  tradeId: string;
  instrument: string;
  instrumentType?:
    | 'stock'
    | 'bond'
    | 'etf'
    | 'mutual_fund'
    | 'option'
    | 'future'
    | 'crypto'
    | 'forex'
    | 'commodity'
    | 'other';
  side?: 'buy' | 'sell';
  quantity?: number;
  price?: number;
  total?: number;
  currency?: string;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  executionVenue?: string;
  accountId?: string;
}

// ---- AI events ----

export interface AiConversationStartedData {
  conversationId: string;
  assistantId?: string;
  assistantName?: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'meta' | 'cohere' | 'mistral' | 'custom' | 'other';
  interface?: 'chat' | 'voice' | 'embedded' | 'api' | 'other';
  context?: string;
}

export interface AiMessageSentData {
  conversationId: string;
  messageId: string;
  role?: 'user' | 'system';
  contentLength?: number;
  hasAttachments?: boolean;
  attachmentTypes?: string[];
  model?: string;
  toolsRequested?: string[];
}

export interface AiResponseReceivedData {
  conversationId: string;
  messageId: string;
  model?: string;
  provider?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  finishReason?: 'stop' | 'length' | 'tool_call' | 'content_filter' | 'error' | 'other';
  isStreaming?: boolean;
  toolsUsed?: string[];
  contentLength?: number;
}

export interface AiFeedbackGivenData {
  conversationId: string;
  messageId: string;
  feedbackType: 'positive' | 'negative' | 'rating' | 'correction' | 'flag';
  rating?: number;
  comment?: string;
  reason?:
    | 'helpful'
    | 'accurate'
    | 'fast'
    | 'unhelpful'
    | 'inaccurate'
    | 'slow'
    | 'harmful'
    | 'irrelevant'
    | 'other';
}

export interface AiSuggestionAcceptedData {
  conversationId?: string;
  suggestionId: string;
  suggestionType?: 'text' | 'code' | 'product' | 'action' | 'link' | 'other';
  source?: 'inline' | 'sidebar' | 'modal' | 'autocomplete' | 'copilot' | 'other';
  acceptMethod?: 'click' | 'keyboard_shortcut' | 'auto' | 'other';
  model?: string;
}

export interface AiSuggestionDismissedData {
  conversationId?: string;
  suggestionId: string;
  suggestionType?: 'text' | 'code' | 'product' | 'action' | 'link' | 'other';
  source?: 'inline' | 'sidebar' | 'modal' | 'autocomplete' | 'copilot' | 'other';
  dismissMethod?: 'click' | 'keyboard_shortcut' | 'escape' | 'ignore' | 'other';
  reason?: 'not_relevant' | 'incorrect' | 'too_slow' | 'already_done' | 'other';
  model?: string;
}

// Re-export generated types when available
// export * from './generated/index.js';
