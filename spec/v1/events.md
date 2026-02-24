# OpenDataLayer Protocol Specification v1 — Events

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

This document defines the ODL event naming convention and the complete event taxonomy. Every trackable action in ODL is represented as a named event that follows the conventions described here.

## 2. Naming Convention

### 2.1 Dot-Namespaced Format

All ODL events follow a strict `category.action` naming convention:

```
category.action
```

- **category**: A broad grouping that identifies the domain of the event (e.g., `page`, `ecommerce`, `media`).
- **action**: The specific action or state change within that category (e.g., `view`, `purchase`, `play`).

The category and action are separated by a single dot (`.`). There MUST be exactly one dot in every event name.

### 2.2 Casing

Both category and action MUST use `snake_case`:

- Lowercase letters and digits only.
- Words separated by underscores.
- No leading or trailing underscores.

**Valid:** `page.view`, `ecommerce.product_viewed`, `form.step_completed`
**Invalid:** `Page.View`, `ecommerce.productViewed`, `FORM.SUBMITTED`

### 2.3 Reserved Categories

The following categories are reserved by the ODL specification and MUST NOT be used for custom events outside the defined taxonomy:

`page`, `ecommerce`, `media`, `consent`, `user`, `form`, `search`, `error`, `performance`, `interaction`, `subscription`, `payment`, `experiment`, `auth`, `onboarding`, `notification`, `social`, `content`, `review`, `referral`, `support`, `communication`, `scheduling`, `marketplace`, `education`, `gaming`, `crm`, `app`, `order`, `account`, `privacy`, `feature`, `loyalty`, `survey`, `collaboration`, `video_call`, `booking`, `file`, `integration`, `automation`, `ad`, `identity`, `document`, `finance`, `ai`

The `custom` category is reserved for user-defined extension events (see [Section 14](#14-custom-events)).

### 2.4 Wildcard Subscriptions

Consumers MAY subscribe to events using wildcard patterns. The wildcard character `*` matches any action within a category:

- `ecommerce.*` matches all ecommerce events.
- `*.*` matches all events (use with caution).
- `*.view` is NOT a valid wildcard pattern — wildcards are only supported on the action segment.

Wildcard subscriptions are described in detail in [transport.md](transport.md).

## 3. Event Taxonomy Overview

The complete ODL event taxonomy is organized into 46 categories:

| Category | Events | Purpose |
|---|---|---|
| `page` | 3 | Page and screen lifecycle |
| `ecommerce` | 19 | Shopping and transaction tracking |
| `media` | 11 | Audio, video, and streaming media |
| `consent` | 3 | Privacy consent management |
| `user` | 5 | Authentication and identity |
| `form` | 6 | Form interaction lifecycle |
| `search` | 4 | Search behavior |
| `error` | 2 | Error tracking |
| `performance` | 4 | Performance measurement |
| `interaction` | 6 | General UI interactions |
| `subscription` | 11 | Subscription lifecycle management |
| `payment` | 9 | Payment methods, invoices, and payouts |
| `experiment` | 4 | A/B testing and feature flags |
| `auth` | 9 | Authentication and security |
| `onboarding` | 8 | User onboarding flows |
| `notification` | 8 | Notification delivery and engagement |
| `social` | 10 | Social interactions and community |
| `content` | 10 | Content lifecycle management |
| `review` | 5 | Reviews and ratings |
| `referral` | 5 | Referral programs and invites |
| `support` | 10 | Customer support and help center |
| `communication` | 8 | Messaging and email communication |
| `scheduling` | 6 | Appointments and scheduling |
| `marketplace` | 8 | Marketplace listings and offers |
| `education` | 8 | Learning and course management |
| `gaming` | 8 | Gaming and gamification |
| `crm` | 12 | Sales pipeline and CRM |
| `app` | 8 | Mobile and desktop app lifecycle |
| `order` | 7 | Order lifecycle and fulfillment |
| `account` | 6 | Account management and team operations |
| `privacy` | 5 | Data privacy and compliance |
| `feature` | 5 | Feature usage and adoption |
| `loyalty` | 7 | Loyalty programs and rewards |
| `survey` | 5 | Surveys and feedback collection |
| `collaboration` | 9 | Workspace collaboration and sharing |
| `video_call` | 7 | Video conferencing and calls |
| `booking` | 7 | Reservations and booking management |
| `file` | 6 | File management and versioning |
| `integration` | 5 | Third-party integration lifecycle |
| `automation` | 5 | Workflow automation and rules |
| `ad` | 5 | Advertising and ad monetization |
| `identity` | 5 | Identity verification and KYC |
| `document` | 5 | Document signing and management |
| `finance` | 7 | Financial transactions and banking |
| `ai` | 6 | AI and chatbot interaction tracking |
| `custom` | Unlimited | Extension events |

---

## 4. Page Events

Page events track navigation and screen lifecycle. These are the most fundamental events in any web or app analytics implementation.

### 4.1 `page.view`

Fired when a user views a page or screen. This is typically the first event emitted on every page load or screen render.

**When to fire:** On initial page load, client-side route changes in single-page applications (SPAs), and screen appearances in mobile apps.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | The page or screen title. |
| `url` | `string` | Yes | The full URL of the page. |
| `path` | `string` | No | The URL path (e.g., `/products/shoes`). |
| `referrer` | `string` | No | The referring URL. |
| `type` | `string` | No | Page type classification (e.g., `"homepage"`, `"product"`, `"category"`, `"article"`). |
| `hash` | `string` | No | The URL hash fragment, if any. |
| `search` | `string` | No | The URL query string, if any. |

```json
{
  "event": "page.view",
  "data": {
    "title": "Running Shoes — Example Store",
    "url": "https://www.example.com/products/running-shoes",
    "path": "/products/running-shoes",
    "referrer": "https://www.google.com/",
    "type": "product"
  }
}
```

### 4.2 `page.leave`

Fired when a user navigates away from a page or the page is being unloaded.

**When to fire:** On `beforeunload`, `pagehide`, or `visibilitychange` (hidden) events, or on client-side route changes before the new page loads.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `duration` | `number` | No | Time spent on the page in milliseconds. |
| `scrollDepth` | `number` | No | Maximum scroll depth reached as a percentage (0-100). |
| `engaged` | `boolean` | No | Whether the user actively engaged with the page (beyond passive viewing). |

### 4.3 `page.virtual_view`

Fired when a virtual page view occurs in a single-page application or modal that represents a logical page but does not trigger a full page load.

**When to fire:** When a SPA route change occurs, a significant modal or overlay is displayed, or a tab/accordion reveals content that constitutes a logical "page."

**Data payload:** Same schema as `page.view`.

---

## 5. Ecommerce Events

Ecommerce events track the complete shopping lifecycle, from product discovery through purchase and post-purchase. This taxonomy is designed to support funnel analysis, attribution, and revenue reporting.

### 5.1 Product Object

Many ecommerce events reference one or more **product objects**. The product object schema is shared across events:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The product SKU or unique identifier. |
| `name` | `string` | Yes | The product name. |
| `brand` | `string` | No | The product brand. |
| `category` | `string` | No | The product category. Use `/` for hierarchy (e.g., `"Shoes/Running"`). |
| `variant` | `string` | No | The product variant (e.g., `"Blue/Size-10"`). |
| `price` | `number` | No | The unit price of the product. |
| `quantity` | `number` | No | The quantity (default: 1). |
| `coupon` | `string` | No | Coupon code applied to this product. |
| `position` | `number` | No | The position of the product in a list or collection. |
| `url` | `string` | No | URL of the product page. |
| `imageUrl` | `string` | No | URL of the product image. |

### 5.2 `ecommerce.product_viewed`

Fired when a user views a product detail page or product modal.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The viewed product. |
| `currency` | `string` | No | ISO 4217 currency code (e.g., `"USD"`). |
| `listId` | `string` | No | ID of the list from which the product was accessed. |
| `listName` | `string` | No | Name of the list from which the product was accessed. |

### 5.3 `ecommerce.product_list_viewed`

Fired when a user views a list of products (e.g., category page, search results, recommendations).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listId` | `string` | Yes | Unique identifier for the product list. |
| `listName` | `string` | No | Human-readable name of the list. |
| `products` | `Product[]` | Yes | Array of product objects in the list. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 5.4 `ecommerce.product_clicked`

Fired when a user clicks on a product in a list to navigate to the product detail page.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The clicked product. |
| `listId` | `string` | No | ID of the list the product was in. |
| `listName` | `string` | No | Name of the list the product was in. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 5.5 `ecommerce.product_added`

Fired when a user adds a product to their cart.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The product added to cart. |
| `cartId` | `string` | No | The cart identifier. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 5.6 `ecommerce.product_removed`

Fired when a user removes a product from their cart.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The product removed from cart. |
| `cartId` | `string` | No | The cart identifier. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 5.7 `ecommerce.cart_viewed`

Fired when a user views their shopping cart.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `cartId` | `string` | No | The cart identifier. |
| `products` | `Product[]` | Yes | Array of products currently in the cart. |
| `cartTotal` | `number` | No | Total value of the cart. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 5.8 `ecommerce.checkout_started`

Fired when a user initiates the checkout process.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | No | Preliminary order identifier, if available. |
| `revenue` | `number` | No | Expected order total. |
| `products` | `Product[]` | Yes | Products being checked out. |
| `currency` | `string` | No | ISO 4217 currency code. |
| `coupon` | `string` | No | Order-level coupon code. |

### 5.9 `ecommerce.checkout_step_completed`

Fired when a user completes a step in a multi-step checkout flow.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `step` | `number` | Yes | The step number (1-indexed). |
| `stepName` | `string` | No | Human-readable name of the step (e.g., `"shipping"`, `"billing"`, `"review"`). |
| `shippingMethod` | `string` | No | Selected shipping method (if applicable to this step). |
| `paymentMethod` | `string` | No | Selected payment method (if applicable to this step). |

### 5.10 `ecommerce.payment_info_entered`

Fired when a user submits payment information during checkout.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `paymentMethod` | `string` | Yes | Payment method type (e.g., `"credit_card"`, `"paypal"`, `"apple_pay"`). |
| `orderId` | `string` | No | The order identifier. |

**Note:** Payment details (card numbers, CVVs) MUST NEVER be included in event data. Only the payment method type is recorded.

### 5.11 `ecommerce.purchase`

Fired when a transaction is successfully completed.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique order/transaction identifier. |
| `affiliation` | `string` | No | Store or affiliation name. |
| `revenue` | `number` | Yes | Total transaction revenue (including tax and shipping). |
| `tax` | `number` | No | Total tax amount. |
| `shipping` | `number` | No | Total shipping cost. |
| `discount` | `number` | No | Total discount amount. |
| `currency` | `string` | Yes | ISO 4217 currency code. |
| `coupon` | `string` | No | Order-level coupon code. |
| `products` | `Product[]` | Yes | Products in the transaction. |

### 5.12 `ecommerce.refund`

Fired when a full or partial refund is processed.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | The original order identifier. |
| `revenue` | `number` | No | Refund amount (positive number). |
| `currency` | `string` | No | ISO 4217 currency code. |
| `products` | `Product[]` | No | Products being refunded (for partial refunds). If omitted, the refund is assumed to be for the full order. |

### 5.13 `ecommerce.coupon_applied`

Fired when a coupon code is successfully applied.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `coupon` | `string` | Yes | The coupon code. |
| `discount` | `number` | No | The discount amount. |
| `orderId` | `string` | No | The order identifier, if applicable. |

### 5.14 `ecommerce.coupon_removed`

Fired when a coupon code is removed.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `coupon` | `string` | Yes | The coupon code that was removed. |
| `orderId` | `string` | No | The order identifier, if applicable. |

### 5.15 `ecommerce.wishlist_product_added`

Fired when a user adds a product to their wishlist.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The product added to the wishlist. |
| `wishlistId` | `string` | No | The wishlist identifier. |
| `wishlistName` | `string` | No | The wishlist name. |

### 5.16 `ecommerce.wishlist_product_removed`

Fired when a user removes a product from their wishlist.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `product` | `Product` | Yes | The product removed from the wishlist. |
| `wishlistId` | `string` | No | The wishlist identifier. |
| `wishlistName` | `string` | No | The wishlist name. |

### 5.17 `ecommerce.cart_abandoned`

Fired when a user abandons their shopping cart without completing a purchase. Typically triggered after a period of inactivity or when the session ends with items still in cart.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `cartId` | `string` | No | The unique identifier of the shopping cart. |
| `products` | `Product[]` | Yes | The list of products in the abandoned cart. |
| `total` | `number` | No | The total monetary value of the abandoned cart. |
| `currency` | `string` | No | ISO 4217 3-letter currency code. |
| `itemCount` | `integer` | No | The number of distinct items in the cart. |
| `cartAge` | `number` | No | Time since the cart was created, in seconds. |
| `lastActivityAt` | `string` | No | ISO 8601 timestamp of the last cart interaction. |
| `abandonmentPage` | `string` | No | The page or checkout step where the user abandoned. |
| `coupon` | `string` | No | The coupon code applied to the cart, if any. |

### 5.18 `ecommerce.shipping_info_entered`

Fired when a user submits shipping information during checkout. Recommended by GA4 and common across analytics platforms.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | No | The order or transaction identifier. |
| `shippingMethod` | `string` | Yes | The shipping method selected (e.g. "ground", "two_day"). |
| `shippingTier` | `string` | No | Shipping speed tier: `"standard"`, `"express"`, `"overnight"`, `"same_day"`, `"pickup"`, `"free"`. |
| `total` | `number` | No | The total monetary value of the order. |
| `shippingCost` | `number` | No | The shipping cost for the order. |
| `currency` | `string` | No | ISO 4217 3-letter currency code. |
| `products` | `Product[]` | No | The list of products included in the order. |
| `estimatedDelivery` | `string` | No | The estimated delivery date in ISO 8601 format. |
| `country` | `string` | No | The destination country code. |
| `postalCode` | `string` | No | The destination postal or ZIP code. |

### 5.19 `ecommerce.promotion_viewed`

Fired when a promotional banner, widget, or placement is displayed to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `promotionId` | `string` | Yes | Unique identifier for the promotion. |
| `name` | `string` | No | Name of the promotion. |
| `creative` | `string` | No | Creative variant name or ID. |
| `position` | `string` | No | Position or slot where the promotion was displayed. |

### 5.20 `ecommerce.promotion_clicked`

Fired when a user clicks on a promotional element.

**Data payload:** Same schema as `ecommerce.promotion_viewed`.

---

## 6. Media Events

Media events track audio, video, and streaming media playback. These events support analytics for content engagement, ad performance, and quality of experience.

### 6.1 Common Media Fields

The following fields are common to most media events and SHOULD be included when available:

| Field | Type | Required | Description |
|---|---|---|---|
| `mediaId` | `string` | Yes | Unique identifier for the media asset. |
| `title` | `string` | No | Title of the media content. |
| `mediaType` | `string` | No | Type of media: `"video"`, `"audio"`, `"livestream"`. |
| `duration` | `number` | No | Total duration in seconds. |
| `position` | `number` | No | Current playback position in seconds. |
| `provider` | `string` | No | Media provider or platform (e.g., `"youtube"`, `"vimeo"`, `"custom"`). |

### 6.2 `media.play`

Fired when media playback begins or resumes.

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `isAutoplay` | `boolean` | No | Whether playback was initiated automatically. |
| `isResume` | `boolean` | No | Whether this is a resumption of previously paused playback. |

### 6.3 `media.pause`

Fired when the user pauses playback.

**Data payload:** Common media fields.

### 6.4 `media.complete`

Fired when the media reaches the end of playback.

**Data payload:** Common media fields.

### 6.5 `media.seek`

Fired when the user seeks to a different position in the media.

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `seekFrom` | `number` | No | Position in seconds the user seeked from. |
| `seekTo` | `number` | No | Position in seconds the user seeked to. |

### 6.6 `media.buffer_start`

Fired when buffering begins (playback is interrupted waiting for data).

**Data payload:** Common media fields.

### 6.7 `media.buffer_end`

Fired when buffering ends and playback resumes.

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `bufferDuration` | `number` | No | Duration of the buffering event in milliseconds. |

### 6.8 `media.quality_change`

Fired when the playback quality changes (e.g., resolution change in adaptive bitrate streaming).

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `fromQuality` | `string` | No | Previous quality level (e.g., `"720p"`, `"1080p"`). |
| `toQuality` | `string` | No | New quality level. |
| `isAutomatic` | `boolean` | No | Whether the change was automatic (adaptive) or user-initiated. |

### 6.9 `media.ad_start`

Fired when a media advertisement begins playing.

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `adType` | `string` | No | Ad type: `"pre-roll"`, `"mid-roll"`, `"post-roll"`, `"overlay"`. |
| `adDuration` | `number` | No | Duration of the ad in seconds. |
| `adProvider` | `string` | No | Ad network or provider. |

### 6.10 `media.ad_complete`

Fired when a media advertisement finishes playing.

**Data payload:** Same schema as `media.ad_start`.

### 6.11 `media.ad_skip`

Fired when a user skips an advertisement.

**Data payload:** Same schema as `media.ad_start`, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `skipPosition` | `number` | No | Position in the ad (in seconds) when the user skipped. |

### 6.12 `media.milestone`

Fired when playback reaches a predefined milestone (e.g., 25%, 50%, 75% of content).

**Data payload:** Common media fields, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `milestone` | `number` | Yes | The milestone reached as a percentage (e.g., `25`, `50`, `75`, `100`). |

---

## 7. Consent Events

Consent events track changes to the user's privacy consent state. These events are critical for compliance with privacy regulations and for driving consent-aware behavior in the data layer.

### 7.1 `consent.given`

Fired when a user grants consent for one or more consent categories.

**When to fire:** When the user interacts with a consent banner, cookie dialog, or preference center and grants consent.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `categories` | `object` | Yes | Map of consent category names to `true` (granted) or `false` (denied). |
| `method` | `string` | Yes | How consent was collected: `"explicit"`, `"implicit"`, `"default"`. |
| `source` | `string` | No | Where consent was collected: `"banner"`, `"preference_center"`, `"registration"`. |

```json
{
  "event": "consent.given",
  "data": {
    "categories": {
      "analytics": true,
      "marketing": false,
      "personalization": true,
      "functional": true
    },
    "method": "explicit",
    "source": "banner"
  }
}
```

### 7.2 `consent.revoked`

Fired when a user revokes previously granted consent.

**Data payload:** Same schema as `consent.given`.

### 7.3 `consent.preferences_updated`

Fired when a user updates their consent preferences (which may include both grants and revocations).

**Data payload:** Same schema as `consent.given`, plus:

| Field | Type | Required | Description |
|---|---|---|---|
| `previousCategories` | `object` | No | The previous consent state, for diffing purposes. |

---

## 8. User Events

User events track authentication, identity, and profile lifecycle changes.

### 8.1 `user.signed_up`

Fired when a new user account is created.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `string` | Yes | The newly created user identifier. |
| `method` | `string` | No | Registration method: `"email"`, `"social"`, `"sso"`, `"phone"`. |
| `provider` | `string` | No | Social/SSO provider name (e.g., `"google"`, `"facebook"`, `"okta"`). |

### 8.2 `user.signed_in`

Fired when a user successfully authenticates.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `string` | Yes | The authenticated user identifier. |
| `method` | `string` | No | Authentication method. |
| `provider` | `string` | No | Authentication provider. |

### 8.3 `user.signed_out`

Fired when a user logs out.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `string` | No | The user identifier of the signed-out user. |

### 8.4 `user.profile_updated`

Fired when a user updates their profile information.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `string` | Yes | The user identifier. |
| `updatedFields` | `string[]` | No | List of field names that were updated (e.g., `["email", "phone"]`). Do NOT include the actual values to avoid PII leakage. |

### 8.5 `user.identified`

Fired when an anonymous user is identified (e.g., through login, form submission, or identity resolution). This event bridges the gap between anonymous and known user states.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `string` | Yes | The identified user identifier. |
| `anonymousId` | `string` | No | The previous anonymous identifier, for stitching purposes. |
| `traits` | `object` | No | User traits to associate with the identified user. |

---

## 9. Form Events

Form events track the lifecycle of form interactions, from initial view through submission or abandonment.

### 9.1 `form.viewed`

Fired when a form becomes visible to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | Unique identifier for the form. |
| `formName` | `string` | No | Human-readable name of the form. |
| `formType` | `string` | No | Type of form: `"contact"`, `"registration"`, `"lead"`, `"checkout"`, `"survey"`, `"other"`. |

### 9.2 `form.started`

Fired when a user begins interacting with a form (first field focus or input).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | The form identifier. |
| `formName` | `string` | No | The form name. |
| `firstField` | `string` | No | Name of the first field the user interacted with. |

### 9.3 `form.step_completed`

Fired when a user completes a step in a multi-step form.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | The form identifier. |
| `step` | `number` | Yes | The step number (1-indexed). |
| `stepName` | `string` | No | Human-readable step name. |
| `totalSteps` | `number` | No | Total number of steps in the form. |

### 9.4 `form.submitted`

Fired when a form is successfully submitted.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | The form identifier. |
| `formName` | `string` | No | The form name. |
| `formType` | `string` | No | The form type. |

**Note:** Form field values MUST NOT be included in the event data to avoid PII leakage. Only metadata about the form itself should be tracked.

### 9.5 `form.error`

Fired when a form submission fails due to validation errors or server errors.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | The form identifier. |
| `errorType` | `string` | No | Type of error: `"validation"`, `"server"`, `"network"`, `"timeout"`. |
| `errorFields` | `string[]` | No | List of field names that had errors. Do NOT include the actual error messages if they contain user input. |
| `errorMessage` | `string` | No | A generic error message (must not contain PII). |

### 9.6 `form.abandoned`

Fired when a user leaves a form after starting it but before submitting.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `formId` | `string` | Yes | The form identifier. |
| `lastField` | `string` | No | The last field the user interacted with before abandoning. |
| `fieldsCompleted` | `number` | No | Number of fields that were filled in. |
| `duration` | `number` | No | Time spent on the form in milliseconds. |

---

## 10. Search Events

Search events track search behavior, including queries, result interactions, and filter usage.

### 10.1 `search.performed`

Fired when a user executes a search query.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The search query string. |
| `resultCount` | `number` | No | Number of results returned. |
| `searchType` | `string` | No | Type of search: `"site"`, `"product"`, `"content"`, `"autocomplete"`. |
| `filters` | `object` | No | Active filters as key-value pairs. |
| `sortBy` | `string` | No | The active sort order. |
| `page` | `number` | No | Results page number (1-indexed). |

### 10.2 `search.result_clicked`

Fired when a user clicks on a search result.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The original search query. |
| `resultId` | `string` | No | Identifier of the clicked result. |
| `resultName` | `string` | No | Name or title of the clicked result. |
| `resultPosition` | `number` | No | Position of the clicked result in the list (1-indexed). |
| `resultUrl` | `string` | No | URL of the clicked result. |

### 10.3 `search.filter_applied`

Fired when a user applies or changes a search filter.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | No | The current search query. |
| `filterName` | `string` | Yes | Name of the filter (e.g., `"brand"`, `"price_range"`, `"color"`). |
| `filterValue` | `string` | Yes | The selected filter value. |
| `resultCount` | `number` | No | Number of results after the filter is applied. |

### 10.4 `search.autocomplete_selected`

Fired when a user selects a suggestion from the search autocomplete dropdown.

**When to fire:** When the user clicks or keyboard-selects an autocomplete suggestion.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The search query at the time of selection. |
| `selectedText` | `string` | Yes | The text of the selected autocomplete suggestion. |
| `selectedIndex` | `integer` | No | The zero-based index of the selected suggestion in the list. |
| `totalSuggestions` | `integer` | No | The total number of suggestions shown. |
| `suggestionType` | `string` | No | The type of suggestion: `"query"`, `"product"`, `"category"`, `"brand"`, `"recent"`, `"other"`. |
| `source` | `string` | No | The source of the autocomplete suggestions. |

---

## 11. Error Events

Error events track application errors and error boundaries. These events support error monitoring and debugging.

### 11.1 `error.occurred`

Fired when an application error occurs (JavaScript errors, API failures, etc.).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | Yes | Error message. MUST NOT contain PII or sensitive data. |
| `type` | `string` | No | Error type: `"javascript"`, `"network"`, `"api"`, `"timeout"`, `"resource"`. |
| `stack` | `string` | No | Stack trace (SHOULD be truncated to a reasonable length). |
| `filename` | `string` | No | Source file where the error occurred. |
| `line` | `number` | No | Line number. |
| `column` | `number` | No | Column number. |
| `isFatal` | `boolean` | No | Whether the error is fatal (application cannot continue). |

### 11.2 `error.boundary_triggered`

Fired when a UI error boundary catches an error (e.g., React error boundaries).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `componentName` | `string` | No | Name of the component that triggered the error boundary. |
| `message` | `string` | Yes | Error message. |
| `fallbackDisplayed` | `boolean` | No | Whether a fallback UI was displayed. |

---

## 12. Performance Events

Performance events track page load times, web vitals, and runtime performance metrics.

### 12.1 `performance.page_load`

Fired when the page has fully loaded and performance timing data is available.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `domContentLoaded` | `number` | No | DOMContentLoaded time in milliseconds. |
| `loadComplete` | `number` | No | Full page load time in milliseconds. |
| `firstByte` | `number` | No | Time to first byte (TTFB) in milliseconds. |
| `domInteractive` | `number` | No | DOM interactive time in milliseconds. |
| `resourceCount` | `number` | No | Number of resources loaded. |
| `transferSize` | `number` | No | Total transfer size in bytes. |

### 12.2 `performance.web_vital`

Fired when a Core Web Vital measurement is collected.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Vital name: `"LCP"`, `"INP"`, `"CLS"`, `"FCP"`, `"TTFB"`. Note: `"FID"` (First Input Delay) is deprecated as of March 2024 in favor of `"INP"` (Interaction to Next Paint). Implementations MAY still accept `"FID"` for backward compatibility but SHOULD prefer `"INP"`. |
| `value` | `number` | Yes | The measured value (units depend on the vital). |
| `rating` | `string` | No | Rating: `"good"`, `"needs-improvement"`, `"poor"`. |
| `delta` | `number` | No | The delta since the last report. |
| `navigationType` | `string` | No | Navigation type: `"navigate"`, `"reload"`, `"back-forward"`, `"prerender"`. |

### 12.3 `performance.resource_timing`

Fired to report timing data for a specific resource (typically for slow or critical resources).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `resourceUrl` | `string` | Yes | URL of the resource. |
| `resourceType` | `string` | No | Type: `"script"`, `"stylesheet"`, `"image"`, `"font"`, `"fetch"`, `"xmlhttprequest"`. |
| `duration` | `number` | No | Total duration in milliseconds. |
| `transferSize` | `number` | No | Transfer size in bytes. |

### 12.4 `performance.long_task`

Fired when a long task (blocking the main thread for more than 50ms) is detected.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `duration` | `number` | Yes | Duration of the long task in milliseconds. |
| `attribution` | `string` | No | Attribution of the long task (e.g., script URL or task name). |

---

## 13. Interaction Events

Interaction events track general UI interactions that do not fit into the more specific categories above.

### 13.1 `interaction.element_clicked`

Fired when a user clicks on a tracked UI element.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `elementId` | `string` | No | The DOM element ID. |
| `elementClass` | `string` | No | The DOM element class(es). |
| `elementTag` | `string` | No | The HTML tag name (e.g., `"button"`, `"a"`, `"div"`). |
| `elementText` | `string` | No | The visible text of the element (truncated to 255 characters). |
| `elementUrl` | `string` | No | The href or destination URL, if applicable. |
| `region` | `string` | No | The page region or section (e.g., `"header"`, `"sidebar"`, `"footer"`, `"hero"`). |

### 13.2 `interaction.element_visible`

Fired when a tracked element becomes visible in the viewport (impression tracking).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `elementId` | `string` | No | The DOM element ID. |
| `elementClass` | `string` | No | The DOM element class(es). |
| `elementTag` | `string` | No | The HTML tag name. |
| `region` | `string` | No | The page region or section. |
| `visiblePercent` | `number` | No | Percentage of the element visible in the viewport. |

### 13.3 `interaction.scroll_depth`

Fired when the user scrolls past a predefined depth threshold.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `depth` | `number` | Yes | Scroll depth as a percentage (e.g., `25`, `50`, `75`, `100`). |
| `direction` | `string` | No | Scroll direction: `"down"`, `"up"`. |

### 13.4 `interaction.file_downloaded`

Fired when a user downloads a file.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileUrl` | `string` | Yes | URL of the downloaded file. |
| `fileName` | `string` | No | Name of the file. |
| `fileType` | `string` | No | File extension or MIME type. |
| `fileSize` | `number` | No | File size in bytes. |

### 13.5 `interaction.share`

Fired when a user shares content via a share mechanism.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | Share method: `"email"`, `"facebook"`, `"twitter"`, `"linkedin"`, `"copy_link"`, `"native"`. |
| `contentType` | `string` | No | Type of content shared: `"page"`, `"product"`, `"article"`. |
| `contentId` | `string` | No | Identifier of the shared content. |
| `contentUrl` | `string` | No | URL of the shared content. |

### 13.6 `interaction.print`

Fired when a user prints a page.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentType` | `string` | No | Type of content printed. |
| `contentId` | `string` | No | Identifier of the printed content. |

---

## 14. Custom Events

The `custom` category is an **escape hatch** for organization-specific events that do not fit into the core taxonomy. Custom events follow the same `category.action` convention but use `custom` as the category prefix.

### 14.1 Naming

Custom events MUST follow the format `custom.action_name`, where `action_name` is a `snake_case` string describing the action.

**Valid:** `custom.quiz_completed`, `custom.chatbot_opened`, `custom.loyalty_points_redeemed`
**Invalid:** `custom.` (empty action), `custom.quizCompleted` (not snake_case)

### 14.2 Data Payloads

Custom events MAY define their own data payload schemas. Implementations SHOULD document custom event schemas using the same JSON Schema format as core events.

### 14.3 Extension Path

If a custom event becomes widely used across multiple organizations, it is a candidate for promotion into the core taxonomy in a future version of the specification. See [extensions.md](extensions.md) for the formal extension process.

---

## 15. Subscription Events

Subscription events track the lifecycle of recurring subscriptions, from creation through trial periods, plan changes, cancellation, and payment issues.

### 15.1 `subscription.created`

Fired when a new subscription is created.

**When to fire:** When a user signs up for a subscription plan, whether starting immediately or beginning with a trial period.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` | Yes | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `interval` | `string` | No | Billing interval for the subscription: `"monthly"`, `"yearly"`, `"weekly"`, `"custom"`. |
| `amount` | `number` | No | The monetary amount charged per billing interval. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `trialDays` | `integer` | No | Number of trial days included with the subscription, if any. |

### 15.2 `subscription.trial_started`

Fired when a subscription trial period begins.

**When to fire:** When the trial period starts for a subscription, typically at the time of subscription creation if a trial is included.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` | Yes | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `trialDays` | `integer` | Yes | Number of days in the trial period. |
| `trialEndDate` | `string` | No | ISO 8601 date or datetime when the trial period ends. |

### 15.3 `subscription.trial_ended`

Fired when a subscription trial period ends.

**When to fire:** When the trial period expires, whether the user converts to a paid subscription, cancels, or the trial simply lapses.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` | Yes | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `converted` | `boolean` | Yes | Whether the trial converted to a paid subscription. |
| `endReason` | `string` | No | The reason the trial ended: `"expired"`, `"converted"`, `"cancelled"`. |

### 15.4 `subscription.activated`

Fired when a subscription becomes active.

**When to fire:** When a subscription transitions to an active billing state, such as after a trial converts or a new subscription starts immediately.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | Yes | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `amount` | `number` | No | The monetary amount charged per billing interval. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `interval` | `string` | No | Billing interval for the subscription (e.g. `"monthly"`, `"yearly"`). |

### 15.5 `subscription.upgraded`

Fired when a subscription is upgraded to a higher-tier plan.

**When to fire:** When a user moves from a lower-tier to a higher-tier subscription plan.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `previousPlanId` | `string` | Yes | Unique identifier of the previous subscription plan. |
| `previousPlanName` | `string` | No | Human-readable name of the previous subscription plan. |
| `newPlanId` | `string` | Yes | Unique identifier of the new subscription plan. |
| `newPlanName` | `string` | No | Human-readable name of the new subscription plan. |
| `previousAmount` | `number` | No | The monetary amount of the previous plan. |
| `newAmount` | `number` | No | The monetary amount of the new plan. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `prorated` | `boolean` | No | Whether the upgrade charge was prorated. |

### 15.6 `subscription.downgraded`

Fired when a subscription is downgraded to a lower-tier plan.

**When to fire:** When a user moves from a higher-tier to a lower-tier subscription plan.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `previousPlanId` | `string` | Yes | Unique identifier of the previous subscription plan. |
| `previousPlanName` | `string` | No | Human-readable name of the previous subscription plan. |
| `newPlanId` | `string` | Yes | Unique identifier of the new subscription plan. |
| `newPlanName` | `string` | No | Human-readable name of the new subscription plan. |
| `previousAmount` | `number` | No | The monetary amount of the previous plan. |
| `newAmount` | `number` | No | The monetary amount of the new plan. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `effectiveDate` | `string` | No | ISO 8601 date or datetime when the downgrade takes effect. |

### 15.7 `subscription.renewed`

Fired when a subscription is successfully renewed.

**When to fire:** When a subscription billing cycle renews and payment is successfully collected.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | No | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `amount` | `number` | No | The monetary amount charged for the renewal. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `interval` | `string` | No | Billing interval for the subscription (e.g. `"monthly"`, `"yearly"`). |
| `renewalCount` | `integer` | No | The number of times this subscription has been renewed. |

### 15.8 `subscription.cancelled`

Fired when a subscription is cancelled.

**When to fire:** When a user or system cancels an active subscription.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | No | Unique identifier for the subscription plan. |
| `planName` | `string` | No | Human-readable name of the subscription plan. |
| `reason` | `string` | No | The reason for cancellation. |
| `feedback` | `string` | No | Additional feedback provided by the user about the cancellation. |
| `effectiveDate` | `string` | No | ISO 8601 date or datetime when the cancellation takes effect. |
| `willExpireAt` | `string` | No | ISO 8601 date or datetime when the subscription access will expire. |

### 15.9 `subscription.paused`

Fired when a subscription is paused.

**When to fire:** When a user pauses their subscription, temporarily suspending billing and/or access.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | No | Unique identifier for the subscription plan. |
| `reason` | `string` | No | The reason the subscription was paused. |
| `resumeDate` | `string` | No | ISO 8601 date or datetime when the subscription is scheduled to resume. |

### 15.10 `subscription.resumed`

Fired when a previously paused subscription is resumed.

**When to fire:** When a paused subscription is reactivated and billing resumes.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | No | Unique identifier for the subscription plan. |
| `pauseDuration` | `number` | No | Duration of pause in days. |

### 15.11 `subscription.payment_failed`

Fired when a subscription payment attempt fails.

**When to fire:** When a recurring billing charge fails, such as due to an expired card, insufficient funds, or payment processor error.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | `string` | Yes | Unique identifier for the subscription. |
| `planId` | `string` | No | Unique identifier for the subscription plan. |
| `amount` | `number` | No | The monetary amount of the failed payment. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `failureReason` | `string` | No | The reason the payment failed. |
| `retryDate` | `string` | No | ISO 8601 date or datetime when the next payment retry is scheduled. |
| `attemptCount` | `integer` | No | The number of payment attempts made including this failure. |

---

## 16. Payment Events

Payment events track payment method management, invoicing, and payouts. These events support financial analytics, billing operations, and payment lifecycle tracking.

### 16.1 `payment.method_added`

Fired when a user adds a new payment method.

**When to fire:** When a user saves a new credit card, bank account, or other payment method to their account.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `methodType` | `string` | Yes | The type of payment method added: `"credit_card"`, `"bank_account"`, `"paypal"`, `"apple_pay"`, `"google_pay"`. |
| `last4` | `string` | No | The last four digits or characters of the payment method identifier. |
| `isDefault` | `boolean` | No | Whether this payment method was set as the default. |

**Note:** Full payment details (card numbers, account numbers) MUST NEVER be included in event data. Only the method type and last4 are recorded.

### 16.2 `payment.method_removed`

Fired when a user removes a payment method.

**When to fire:** When a user deletes a saved payment method from their account.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `methodType` | `string` | Yes | The type of payment method removed. |
| `last4` | `string` | No | The last four digits or characters of the payment method identifier. |

### 16.3 `payment.method_updated`

Fired when a user updates an existing payment method.

**When to fire:** When a user modifies details of a saved payment method, such as updating an expiration date.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `methodType` | `string` | Yes | The type of payment method updated. |
| `updatedFields` | `string[]` | No | List of field names that were updated on the payment method. |

### 16.4 `payment.invoice_created`

Fired when a new invoice is created.

**When to fire:** When the billing system generates a new invoice for a customer.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `invoiceId` | `string` | Yes | Unique identifier for the invoice. |
| `amount` | `number` | Yes | The total monetary amount of the invoice. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `dueDate` | `string` | No | ISO 8601 date or datetime when the invoice is due. |
| `lineItems` | `object[]` | No | List of individual line items on the invoice. Each item may include `description` (string), `amount` (number), and `quantity` (integer). |

### 16.5 `payment.invoice_paid`

Fired when an invoice is successfully paid.

**When to fire:** When payment is received and applied to an outstanding invoice.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `invoiceId` | `string` | Yes | Unique identifier for the invoice. |
| `amount` | `number` | Yes | The monetary amount that was paid. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `paymentMethod` | `string` | No | The payment method used to pay the invoice. |
| `paidAt` | `string` | No | ISO 8601 datetime when the payment was made. |

### 16.6 `payment.invoice_overdue`

Fired when an invoice becomes overdue.

**When to fire:** When an invoice passes its due date without payment.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `invoiceId` | `string` | Yes | Unique identifier for the invoice. |
| `amount` | `number` | Yes | The outstanding monetary amount of the invoice. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `dueDate` | `string` | No | ISO 8601 date or datetime when the invoice was due. |
| `daysOverdue` | `integer` | No | The number of days the invoice is overdue. |

### 16.7 `payment.payout_initiated`

Fired when a payout is initiated.

**When to fire:** When a payout to a seller, partner, or vendor is initiated by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `payoutId` | `string` | Yes | Unique identifier for the payout. |
| `amount` | `number` | Yes | The monetary amount of the payout. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `destination` | `string` | No | The destination account or identifier for the payout. |
| `method` | `string` | No | The method used for the payout (e.g. `"bank_transfer"`, `"check"`). |

### 16.8 `payment.payout_completed`

Fired when a payout is successfully completed.

**When to fire:** When a payout has been processed and funds have been transferred.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `payoutId` | `string` | Yes | Unique identifier for the payout. |
| `amount` | `number` | Yes | The monetary amount of the payout. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `destination` | `string` | No | The destination account or identifier for the payout. |
| `completedAt` | `string` | No | ISO 8601 datetime when the payout was completed. |

### 16.9 `payment.payment_failed`

Fired when a payment attempt fails.

**When to fire:** When a payment transaction is declined or fails for any reason.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `paymentId` | `string` | Yes | Unique identifier for the payment attempt. |
| `amount` | `number` | Yes | The monetary amount of the failed payment. |
| `currency` | `string` | Yes | ISO 4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"GBP"`). |
| `paymentMethod` | `string` | No | The payment method used: `"credit_card"`, `"debit_card"`, `"bank_transfer"`, `"paypal"`, `"apple_pay"`, `"google_pay"`, `"crypto"`, `"other"`. |
| `failureReason` | `string` | No | The reason for failure: `"insufficient_funds"`, `"card_declined"`, `"expired_card"`, `"fraud_suspected"`, `"network_error"`, `"invalid_details"`, `"other"`. |
| `orderId` | `string` | No | The order associated with the payment. |
| `invoiceId` | `string` | No | The invoice associated with the payment. |
| `retryCount` | `integer` | No | The number of payment retry attempts. |

---

## 17. Experiment Events

Experiment events track A/B testing, multivariate experiments, and feature flag evaluations. These events support experimentation platforms, conversion analysis, and feature rollout tracking.

### 17.1 `experiment.exposure`

Fired when a user is exposed to an experiment variant.

**When to fire:** When the experiment variant is rendered or displayed to the user, confirming actual exposure (not just assignment).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `experimentId` | `string` | Yes | Unique identifier for the experiment. |
| `experimentName` | `string` | No | Human-readable name of the experiment. |
| `variantId` | `string` | Yes | Unique identifier for the variant the user was exposed to. |
| `variantName` | `string` | No | Human-readable name of the variant. |
| `isControl` | `boolean` | No | Whether the variant is the control group. |

### 17.2 `experiment.variant_assigned`

Fired when a user is assigned to an experiment variant.

**When to fire:** When the experimentation system assigns a user to a specific variant, which may happen before actual exposure.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `experimentId` | `string` | Yes | Unique identifier for the experiment. |
| `experimentName` | `string` | No | Human-readable name of the experiment. |
| `variantId` | `string` | Yes | Unique identifier for the assigned variant. |
| `variantName` | `string` | No | Human-readable name of the assigned variant. |
| `assignmentMethod` | `string` | No | The method used to assign the variant: `"random"`, `"targeted"`, `"override"`. |

### 17.3 `experiment.conversion`

Fired when a user converts within an experiment.

**When to fire:** When a user who has been exposed to an experiment variant completes a defined conversion goal.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `experimentId` | `string` | Yes | Unique identifier for the experiment. |
| `experimentName` | `string` | No | Human-readable name of the experiment. |
| `variantId` | `string` | Yes | Unique identifier for the variant the user was in when they converted. |
| `variantName` | `string` | No | Human-readable name of the variant. |
| `goalId` | `string` | No | Unique identifier for the conversion goal. |
| `goalName` | `string` | No | Human-readable name of the conversion goal. |
| `value` | `number` | No | The monetary or numeric value associated with the conversion. |

### 17.4 `experiment.feature_flag_evaluated`

Fired when a feature flag is evaluated for a user.

**When to fire:** When the feature flag system evaluates a flag's value for a given user context.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flagKey` | `string` | Yes | The unique key identifying the feature flag. |
| `flagValue` | `any` | No | The evaluated value of the feature flag. |
| `enabled` | `boolean` | Yes | Whether the feature flag is enabled. |
| `reason` | `string` | No | The reason for the evaluated flag value: `"match"`, `"default"`, `"error"`, `"override"`. |

---

## 18. Auth Events

Auth events track authentication security actions such as password resets, multi-factor authentication, session management, and token lifecycle. These complement the core `user` events with more granular security-focused tracking.

### 18.1 `auth.password_reset_requested`

Fired when a user requests a password reset.

**When to fire:** When a user submits a "forgot password" request.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | No | Reset delivery method: `"email"`, `"sms"`, `"security_question"`. |

### 18.2 `auth.password_reset_completed`

Fired when a user successfully completes a password reset.

**When to fire:** When the user sets a new password via the reset flow.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | No | The method used to complete the reset. |

### 18.3 `auth.mfa_enabled`

Fired when a user enables multi-factor authentication.

**When to fire:** When MFA is successfully configured and activated on the user's account.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | MFA method: `"totp"`, `"sms"`, `"email"`, `"hardware_key"`, `"push"`. |
| `userId` | `string` | No | The user identifier. |

### 18.4 `auth.mfa_disabled`

Fired when a user disables multi-factor authentication.

**When to fire:** When MFA is removed from the user's account.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | The MFA method that was disabled. |
| `userId` | `string` | No | The user identifier. |

### 18.5 `auth.mfa_challenged`

Fired when a user is presented with a multi-factor authentication challenge.

**When to fire:** When the system prompts the user to complete an MFA challenge during login or a sensitive action.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | The MFA method being challenged. |
| `challengeType` | `string` | No | The type of challenge: `"login"`, `"sensitive_action"`, `"step_up"`. |

### 18.6 `auth.mfa_completed`

Fired when a user completes a multi-factor authentication challenge.

**When to fire:** When the user submits a response to an MFA challenge, whether successful or not.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | The MFA method used. |
| `success` | `boolean` | Yes | Whether the MFA challenge was completed successfully. |
| `challengeType` | `string` | No | The type of challenge that was completed. |

### 18.7 `auth.session_expired`

Fired when a user session expires.

**When to fire:** When a session is terminated due to timeout, revocation, or other reasons.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | `string` | No | The reason for session expiration: `"timeout"`, `"revoked"`, `"password_change"`, `"forced"`. |
| `sessionDuration` | `number` | No | Session duration in seconds. |

### 18.8 `auth.token_refreshed`

Fired when an authentication token is refreshed.

**When to fire:** When the system refreshes an authentication token to maintain the user's session.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tokenType` | `string` | No | The type of token refreshed: `"access"`, `"refresh"`, `"id"`. |
| `expiresIn` | `integer` | No | Time until expiration in seconds. |

### 18.9 `auth.login_failed`

Fired when a user login attempt fails.

**When to fire:** When an authentication attempt is rejected due to invalid credentials, account lockout, or other failure conditions.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | `string` | Yes | The authentication method attempted: `"password"`, `"sso"`, `"oauth"`, `"magic_link"`, `"passkey"`, `"biometric"`, `"other"`. |
| `failureReason` | `string` | Yes | The reason for failure: `"invalid_credentials"`, `"account_locked"`, `"account_disabled"`, `"account_not_found"`, `"mfa_required"`, `"expired_password"`, `"rate_limited"`, `"network_error"`, `"other"`. |
| `userId` | `string` | No | The user ID if identifiable despite the failed attempt. |
| `email` | `string` | No | The email address used in the login attempt. |
| `attemptCount` | `integer` | No | The number of consecutive failed attempts. |
| `ipAddress` | `string` | No | The IP address of the login attempt. |

---

## 19. Onboarding Events

Onboarding events track user onboarding flows, guided tours, and setup checklists. These events support onboarding funnel analysis, drop-off detection, and activation metrics.

### 19.1 `onboarding.started`

Fired when a user begins an onboarding flow.

**When to fire:** When the first screen or step of an onboarding flow is presented to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flowId` | `string` | Yes | Unique identifier for the onboarding flow. |
| `flowName` | `string` | No | Human-readable name of the onboarding flow. |
| `totalSteps` | `integer` | No | Total number of steps in the onboarding flow. |

### 19.2 `onboarding.step_completed`

Fired when a user completes a step in an onboarding flow.

**When to fire:** When the user successfully finishes an individual onboarding step.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flowId` | `string` | Yes | Unique identifier for the onboarding flow. |
| `step` | `integer` | Yes | The step number (1-indexed). |
| `stepName` | `string` | No | Human-readable name of the step. |
| `totalSteps` | `integer` | No | Total number of steps in the onboarding flow. |
| `duration` | `number` | No | Time spent on this step in milliseconds. |

### 19.3 `onboarding.step_skipped`

Fired when a user skips a step in an onboarding flow.

**When to fire:** When the user chooses to skip an optional onboarding step.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flowId` | `string` | Yes | Unique identifier for the onboarding flow. |
| `step` | `integer` | Yes | The step number that was skipped (1-indexed). |
| `stepName` | `string` | No | Human-readable name of the skipped step. |

### 19.4 `onboarding.completed`

Fired when a user completes an entire onboarding flow.

**When to fire:** When the user reaches the end of the onboarding flow, having completed or skipped all steps.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flowId` | `string` | Yes | Unique identifier for the onboarding flow. |
| `flowName` | `string` | No | Human-readable name of the onboarding flow. |
| `totalDuration` | `number` | No | Total time to complete in milliseconds. |
| `stepsCompleted` | `integer` | No | Number of steps completed. |
| `stepsSkipped` | `integer` | No | Number of steps skipped. |

### 19.5 `onboarding.abandoned`

Fired when a user abandons an onboarding flow before completion.

**When to fire:** When the user leaves the onboarding flow without finishing all steps.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `flowId` | `string` | Yes | Unique identifier for the onboarding flow. |
| `lastStep` | `integer` | No | The last step number the user was on before abandoning. |
| `lastStepName` | `string` | No | Human-readable name of the last step. |
| `stepsCompleted` | `integer` | No | Number of steps completed before abandoning. |
| `duration` | `number` | No | Time spent in the onboarding flow in milliseconds. |

### 19.6 `onboarding.tour_started`

Fired when a user begins a guided product tour.

**When to fire:** When a product tour overlay or walkthrough is initiated.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tourId` | `string` | Yes | Unique identifier for the tour. |
| `tourName` | `string` | No | Human-readable name of the tour. |
| `trigger` | `string` | No | How the tour was triggered: `"auto"`, `"manual"`, `"contextual"`. |

### 19.7 `onboarding.tour_completed`

Fired when a user completes a guided product tour.

**When to fire:** When the user reaches the final step of a product tour.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tourId` | `string` | Yes | Unique identifier for the tour. |
| `tourName` | `string` | No | Human-readable name of the tour. |
| `stepsViewed` | `integer` | No | Number of tour steps the user viewed. |
| `totalSteps` | `integer` | No | Total number of steps in the tour. |

### 19.8 `onboarding.checklist_item_completed`

Fired when a user completes an item in an onboarding checklist.

**When to fire:** When the user finishes a task in a setup checklist or getting-started guide.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `checklistId` | `string` | Yes | Unique identifier for the checklist. |
| `itemId` | `string` | Yes | Unique identifier for the checklist item. |
| `itemName` | `string` | No | Human-readable name of the checklist item. |
| `completedCount` | `integer` | No | Number of checklist items completed so far. |
| `totalItems` | `integer` | No | Total number of items in the checklist. |

---

## 20. Notification Events

Notification events track the delivery and engagement lifecycle of notifications across all channels (push, in-app, email, SMS). These events support notification effectiveness analysis and permission management.

### 20.1 `notification.sent`

Fired when a notification is sent to a user.

**When to fire:** When the system dispatches a notification through any channel.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notificationId` | `string` | Yes | Unique identifier for the notification. |
| `channel` | `string` | Yes | Delivery channel: `"push"`, `"in_app"`, `"email"`, `"sms"`, `"webhook"`. |
| `title` | `string` | No | Title of the notification. |
| `campaignId` | `string` | No | Identifier of the associated campaign. |

### 20.2 `notification.delivered`

Fired when a notification is successfully delivered to a user.

**When to fire:** When delivery confirmation is received from the notification channel.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notificationId` | `string` | Yes | Unique identifier for the notification. |
| `channel` | `string` | Yes | Delivery channel used. |
| `deliveredAt` | `string` | No | ISO 8601 datetime when the notification was delivered. |

### 20.3 `notification.opened`

Fired when a user opens a notification.

**When to fire:** When the user taps or clicks to open a notification.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notificationId` | `string` | Yes | Unique identifier for the notification. |
| `channel` | `string` | Yes | Delivery channel of the notification. |
| `title` | `string` | No | Title of the notification. |
| `campaignId` | `string` | No | Identifier of the associated campaign. |
| `timeSinceSent` | `number` | No | Time since sent in seconds. |

### 20.4 `notification.clicked`

Fired when a user clicks an action within a notification.

**When to fire:** When the user interacts with a specific action button or link in a notification.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notificationId` | `string` | Yes | Unique identifier for the notification. |
| `channel` | `string` | Yes | Delivery channel of the notification. |
| `actionId` | `string` | No | Identifier of the specific action clicked. |
| `actionUrl` | `string` | No | URL associated with the action. |
| `campaignId` | `string` | No | Identifier of the associated campaign. |

### 20.5 `notification.dismissed`

Fired when a user dismisses a notification.

**When to fire:** When the user swipes away, closes, or otherwise dismisses a notification without engaging.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notificationId` | `string` | Yes | Unique identifier for the notification. |
| `channel` | `string` | Yes | Delivery channel of the notification. |
| `reason` | `string` | No | Reason for dismissal: `"user"`, `"timeout"`, `"replaced"`. |

### 20.6 `notification.permission_requested`

Fired when the application requests notification permission from a user.

**When to fire:** When the app displays a system or custom permission prompt for notifications.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `channel` | `string` | Yes | The notification channel permission is requested for. |
| `trigger` | `string` | No | What triggered the permission request: `"app_start"`, `"contextual"`, `"settings"`. |

### 20.7 `notification.permission_granted`

Fired when a user grants notification permission.

**When to fire:** When the user allows notification delivery through the permission prompt.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `channel` | `string` | Yes | The notification channel permission was granted for. |

### 20.8 `notification.permission_denied`

Fired when a user denies notification permission.

**When to fire:** When the user declines notification delivery through the permission prompt.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `channel` | `string` | Yes | The notification channel permission was denied for. |
| `isPermanent` | `boolean` | No | Whether the denial is permanent (e.g., "Don't ask again"). |

---

## 21. Social Events

Social events track social interactions including follows, likes, comments, posts, and reactions. These events support community engagement analytics and content interaction tracking.

### 21.1 `social.follow`

Fired when a user follows another user.

**When to fire:** When the follow action is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `targetUserId` | `string` | Yes | The unique identifier of the user being followed. |
| `targetUserName` | `string` | No | The display name of the user being followed. |
| `source` | `string` | No | The source from which the follow action was initiated: `"profile"`, `"suggestion"`, `"search"`, `"content"`. |

### 21.2 `social.unfollow`

Fired when a user unfollows another user.

**When to fire:** When the unfollow action is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `targetUserId` | `string` | Yes | The unique identifier of the user being unfollowed. |
| `targetUserName` | `string` | No | The display name of the user being unfollowed. |
| `reason` | `string` | No | The reason for unfollowing. |

### 21.3 `social.like`

Fired when a user likes a piece of content.

**When to fire:** When the like action is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content being liked. |
| `contentType` | `string` | No | The type of content being liked: `"post"`, `"comment"`, `"article"`, `"product"`, `"review"`, `"other"`. |

### 21.4 `social.unlike`

Fired when a user removes a like from a piece of content.

**When to fire:** When the unlike action is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content being unliked. |
| `contentType` | `string` | No | The type of content being unliked. |

### 21.5 `social.comment_posted`

Fired when a user posts a comment on a piece of content.

**When to fire:** When the comment is successfully created and visible.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content being commented on. |
| `contentType` | `string` | No | The type of content being commented on. |
| `commentId` | `string` | No | The unique identifier of the newly created comment. |
| `parentCommentId` | `string` | No | The unique identifier of the parent comment if this is a reply. |
| `isReply` | `boolean` | No | Whether this comment is a reply to another comment. |

### 21.6 `social.comment_deleted`

Fired when a comment is deleted from a piece of content.

**When to fire:** When a comment is removed, whether by the author, a moderator, or an automated policy.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `commentId` | `string` | Yes | The unique identifier of the deleted comment. |
| `contentId` | `string` | No | The unique identifier of the content the comment was on. |
| `reason` | `string` | No | The reason the comment was deleted: `"user"`, `"moderation"`, `"policy"`. |

### 21.7 `social.post_created`

Fired when a user creates a new post.

**When to fire:** When the post is successfully created and published or saved.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `postId` | `string` | Yes | The unique identifier of the newly created post. |
| `postType` | `string` | No | The type of post created: `"text"`, `"image"`, `"video"`, `"link"`, `"poll"`, `"story"`. |
| `hasMedia` | `boolean` | No | Whether the post contains media attachments. |
| `visibility` | `string` | No | The visibility setting of the post: `"public"`, `"private"`, `"followers"`, `"group"`. |

### 21.8 `social.post_deleted`

Fired when a post is deleted.

**When to fire:** When a post is removed, whether by the author, a moderator, or an automated policy.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `postId` | `string` | Yes | The unique identifier of the deleted post. |
| `reason` | `string` | No | The reason the post was deleted: `"user"`, `"moderation"`, `"policy"`. |

### 21.9 `social.reaction_added`

Fired when a user adds a reaction to a piece of content.

**When to fire:** When the reaction is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content being reacted to. |
| `contentType` | `string` | No | The type of content being reacted to. |
| `reactionType` | `string` | Yes | The type of reaction added: `"like"`, `"love"`, `"haha"`, `"wow"`, `"sad"`, `"angry"`. |

### 21.10 `social.reaction_removed`

Fired when a user removes a reaction from a piece of content.

**When to fire:** When the reaction removal is confirmed by the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content the reaction is being removed from. |
| `contentType` | `string` | No | The type of content the reaction is being removed from. |
| `reactionType` | `string` | Yes | The type of reaction removed. |

---

## 22. Content Events

Content events track the lifecycle of content items (articles, blog posts, documentation, etc.) from creation through publication, engagement, and archival.

### 22.1 `content.viewed`

Fired when a user views a piece of content.

**When to fire:** When a content item is rendered and visible to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content viewed. |
| `contentType` | `string` | No | The type of content viewed: `"article"`, `"blog"`, `"page"`, `"documentation"`, `"video"`, `"podcast"`, `"other"`. |
| `title` | `string` | No | The title of the content. |
| `author` | `string` | No | The author of the content. |
| `category` | `string` | No | The category of the content. |
| `tags` | `string[]` | No | Tags associated with the content. |
| `wordCount` | `integer` | No | The word count of the content. |
| `readTime` | `number` | No | Estimated read time in seconds. |

### 22.2 `content.created`

Fired when a new piece of content is created.

**When to fire:** When a content item is saved for the first time, whether as a draft or published.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content created. |
| `contentType` | `string` | No | The type of content created. |
| `title` | `string` | No | The title of the content. |
| `author` | `string` | No | The author of the content. |
| `category` | `string` | No | The category of the content. |
| `status` | `string` | No | The initial status of the content: `"draft"`, `"review"`, `"published"`. |

### 22.3 `content.updated`

Fired when an existing piece of content is updated.

**When to fire:** When any changes are saved to an existing content item.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content updated. |
| `contentType` | `string` | No | The type of content updated. |
| `title` | `string` | No | The title of the content. |
| `updatedFields` | `string[]` | No | The list of fields that were updated. |
| `version` | `integer` | No | The version number after the update. |

### 22.4 `content.deleted`

Fired when a piece of content is deleted.

**When to fire:** When a content item is permanently removed or moved to trash.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content deleted. |
| `contentType` | `string` | No | The type of content deleted. |
| `title` | `string` | No | The title of the content. |
| `reason` | `string` | No | The reason the content was deleted. |

### 22.5 `content.published`

Fired when a piece of content is published.

**When to fire:** When a content item transitions from draft/review to a published state.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content published. |
| `contentType` | `string` | No | The type of content published. |
| `title` | `string` | No | The title of the content. |
| `author` | `string` | No | The author of the content. |
| `category` | `string` | No | The category of the content. |
| `publishedAt` | `string` | No | The timestamp when the content was published. |

### 22.6 `content.archived`

Fired when a piece of content is archived.

**When to fire:** When a content item is moved to an archived state, removing it from active display.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content archived. |
| `contentType` | `string` | No | The type of content archived. |
| `title` | `string` | No | The title of the content. |
| `reason` | `string` | No | The reason the content was archived. |

### 22.7 `content.rated`

Fired when a user rates a piece of content.

**When to fire:** When a user submits a rating for a content item.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content rated. |
| `contentType` | `string` | No | The type of content rated. |
| `rating` | `number` | Yes | Rating value. |
| `maxRating` | `number` | No | Maximum possible rating. |
| `ratingType` | `string` | No | The type of rating system used: `"stars"`, `"thumbs"`, `"numeric"`, `"emoji"`. |

### 22.8 `content.bookmarked`

Fired when a user bookmarks a piece of content.

**When to fire:** When a user saves a content item for later reading or reference.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content bookmarked. |
| `contentType` | `string` | No | The type of content bookmarked. |
| `title` | `string` | No | The title of the content. |
| `collectionId` | `string` | No | The unique identifier of the bookmark collection. |
| `collectionName` | `string` | No | The name of the bookmark collection. |

### 22.9 `content.shared`

Fired when a user shares a piece of content.

**When to fire:** When a user shares a content item through any available sharing mechanism.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the content shared. |
| `contentType` | `string` | No | The type of content shared. |
| `title` | `string` | No | The title of the content. |
| `method` | `string` | No | The method used to share the content: `"email"`, `"social"`, `"copy_link"`, `"embed"`, `"messaging"`. |
| `destination` | `string` | No | The destination where the content was shared. |

### 22.10 `content.drafted`

Fired when a user creates or saves a draft of content.

**When to fire:** When a user saves a content item as a draft, either manually or via auto-save.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contentId` | `string` | Yes | The unique identifier of the drafted content. |
| `contentType` | `string` | No | The type of content: `"article"`, `"blog_post"`, `"page"`, `"email"`, `"social_post"`, `"document"`, `"other"`. |
| `title` | `string` | No | The title of the draft. |
| `authorId` | `string` | No | The unique identifier of the author. |
| `wordCount` | `integer` | No | The word count of the draft content. |
| `isAutoSaved` | `boolean` | No | Whether the draft was saved automatically. |

---

## 23. Review Events

Review events track the lifecycle of user reviews, including submission, updates, helpfulness votes, and moderation.

### 23.1 `review.submitted`

Fired when a user submits a review.

**When to fire:** When a review is successfully created and submitted for an item.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reviewId` | `string` | No | The unique identifier of the review. |
| `targetId` | `string` | Yes | The unique identifier of the item being reviewed. |
| `targetType` | `string` | No | The type of item being reviewed: `"product"`, `"service"`, `"business"`, `"app"`, `"course"`, `"other"`. |
| `rating` | `number` | Yes | The rating given in the review. |
| `maxRating` | `number` | No | The maximum possible rating. |
| `hasText` | `boolean` | No | Whether the review includes text content. |
| `hasMedia` | `boolean` | No | Whether the review includes media attachments. |
| `isVerifiedPurchase` | `boolean` | No | Whether the reviewer has a verified purchase of the item. |

### 23.2 `review.updated`

Fired when a user updates an existing review.

**When to fire:** When a previously submitted review is modified by the original reviewer.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reviewId` | `string` | Yes | The unique identifier of the review being updated. |
| `targetId` | `string` | No | The unique identifier of the item being reviewed. |
| `previousRating` | `number` | No | The previous rating before the update. |
| `newRating` | `number` | Yes | The new rating after the update. |

### 23.3 `review.deleted`

Fired when a review is deleted.

**When to fire:** When a review is removed, whether by the author, a moderator, or an automated policy.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reviewId` | `string` | Yes | The unique identifier of the deleted review. |
| `targetId` | `string` | No | The unique identifier of the item that was reviewed. |
| `reason` | `string` | No | The reason the review was deleted: `"user"`, `"moderation"`, `"policy"`. |

### 23.4 `review.helpful_marked`

Fired when a user marks a review as helpful or not helpful.

**When to fire:** When a user votes on the helpfulness of another user's review.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reviewId` | `string` | Yes | The unique identifier of the review being marked. |
| `targetId` | `string` | No | The unique identifier of the item that was reviewed. |
| `isHelpful` | `boolean` | Yes | Whether the review was marked as helpful. |

### 23.5 `review.reported`

Fired when a user reports a review.

**When to fire:** When a user flags a review for violating content policies or being inappropriate.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reviewId` | `string` | Yes | The unique identifier of the review being reported. |
| `reason` | `string` | Yes | The reason the review is being reported: `"spam"`, `"inappropriate"`, `"fake"`, `"offensive"`, `"other"`. |

---

## 24. Referral Events

Referral events track referral program activities, including link creation, sharing, invitations, and reward fulfillment.

### 24.1 `referral.link_created`

Fired when a user creates a referral link.

**When to fire:** When a unique referral link is generated for a user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `referralId` | `string` | Yes | The unique identifier of the referral. |
| `programId` | `string` | No | The unique identifier of the referral program. |
| `programName` | `string` | No | The name of the referral program. |
| `channel` | `string` | No | The channel through which the referral link was created. |

### 24.2 `referral.link_shared`

Fired when a user shares a referral link.

**When to fire:** When a user distributes their referral link through any sharing mechanism.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `referralId` | `string` | Yes | The unique identifier of the referral. |
| `method` | `string` | No | The method used to share the referral link: `"email"`, `"social"`, `"copy_link"`, `"sms"`, `"messaging"`. |
| `channel` | `string` | No | The specific channel or platform where the link was shared. |

### 24.3 `referral.invite_sent`

Fired when a user sends a referral invite.

**When to fire:** When a direct referral invitation is sent to a specific person.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `referralId` | `string` | Yes | The unique identifier of the referral. |
| `method` | `string` | Yes | The method used to send the invite. |
| `programId` | `string` | No | The unique identifier of the referral program. |

### 24.4 `referral.invite_accepted`

Fired when a referred user accepts a referral invite.

**When to fire:** When the referred user completes the required action (e.g., signs up) through the referral.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `referralId` | `string` | Yes | The unique identifier of the referral. |
| `referrerId` | `string` | No | The unique identifier of the user who made the referral. |
| `programId` | `string` | No | The unique identifier of the referral program. |

### 24.5 `referral.reward_earned`

Fired when a user earns a reward from a referral.

**When to fire:** When the referral program grants a reward to the referrer or the referred user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `referralId` | `string` | Yes | The unique identifier of the referral. |
| `rewardType` | `string` | Yes | The type of reward earned: `"credit"`, `"discount"`, `"cash"`, `"points"`, `"free_month"`, `"other"`. |
| `rewardValue` | `number` | No | The monetary or point value of the reward. |
| `currency` | `string` | No | The currency of the reward value. |
| `programId` | `string` | No | The unique identifier of the referral program. |

---

## 25. Support Events

Support events track customer support interactions including tickets, live chat, feedback, and help center engagement.

### 25.1 `support.ticket_created`

Fired when a new support ticket is created by a user or on behalf of a user.

**When to fire:** When a support request is submitted through any channel.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ticketId` | `string` | Yes | Unique identifier for the support ticket. |
| `subject` | `string` | No | Subject line or title of the support ticket. |
| `category` | `string` | No | Category or topic of the support ticket. |
| `priority` | `string` | No | Priority level assigned to the ticket: `"low"`, `"medium"`, `"high"`, `"urgent"`. |
| `channel` | `string` | No | Channel through which the ticket was submitted: `"web"`, `"email"`, `"phone"`, `"chat"`, `"social"`. |

### 25.2 `support.ticket_updated`

Fired when an existing support ticket is updated, such as a status change or reassignment.

**When to fire:** When any meaningful change is made to a ticket's status, assignment, or metadata.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ticketId` | `string` | Yes | Unique identifier for the support ticket. |
| `status` | `string` | No | Current status of the ticket after the update: `"open"`, `"in_progress"`, `"waiting"`, `"escalated"`, `"resolved"`, `"closed"`. |
| `previousStatus` | `string` | No | Status of the ticket before the update. |
| `assigneeId` | `string` | No | Identifier of the agent or team assigned to the ticket. |

### 25.3 `support.ticket_resolved`

Fired when a support ticket is resolved or closed with a resolution.

**When to fire:** When a ticket reaches a terminal state with a defined resolution.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ticketId` | `string` | Yes | Unique identifier for the support ticket. |
| `resolution` | `string` | No | Type of resolution applied to the ticket: `"solved"`, `"closed"`, `"duplicate"`, `"wont_fix"`, `"auto_resolved"`. |
| `resolutionTime` | `number` | No | Time to resolution in seconds. |
| `responseCount` | `integer` | No | Total number of responses exchanged on the ticket. |

### 25.4 `support.chat_started`

Fired when a support chat session is initiated by a user or proactively by the system.

**When to fire:** When a live chat, chatbot, or messaging support session begins.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `chatId` | `string` | Yes | Unique identifier for the chat session. |
| `channel` | `string` | No | Type of chat channel used: `"live_chat"`, `"chatbot"`, `"messaging"`. |
| `topic` | `string` | No | Topic or reason for the chat session. |
| `isProactive` | `boolean` | No | Whether the chat was proactively initiated by the system or agent. |

### 25.5 `support.chat_ended`

Fired when a support chat session ends, whether closed by the user, agent, or system.

**When to fire:** When a chat session is terminated by any party.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `chatId` | `string` | Yes | Unique identifier for the chat session. |
| `duration` | `number` | No | Chat duration in seconds. |
| `messageCount` | `integer` | No | Total number of messages exchanged during the chat. |
| `resolved` | `boolean` | No | Whether the user's issue was resolved during the chat. |
| `endedBy` | `string` | No | Who ended the chat session: `"user"`, `"agent"`, `"system"`. |

### 25.6 `support.feedback_submitted`

Fired when a user submits feedback such as a CSAT survey, NPS rating, or general feedback.

**When to fire:** When the user completes and submits a feedback form or survey.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `feedbackId` | `string` | No | Unique identifier for the feedback submission. |
| `type` | `string` | Yes | Type of feedback being submitted: `"csat"`, `"nps"`, `"ces"`, `"general"`, `"bug_report"`, `"feature_request"`. |
| `score` | `number` | No | Numeric score given by the user. |
| `maxScore` | `number` | No | Maximum possible score for the feedback scale. |
| `hasComment` | `boolean` | No | Whether the user included a written comment with the feedback. |
| `channel` | `string` | No | Channel through which the feedback was submitted. |

### 25.7 `support.rating_given`

Fired when a user gives a rating to an agent, interaction, article, or resolution.

**When to fire:** When the user rates a specific support entity.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `targetId` | `string` | Yes | Unique identifier of the item being rated. |
| `targetType` | `string` | Yes | Type of entity being rated: `"agent"`, `"interaction"`, `"article"`, `"resolution"`. |
| `rating` | `number` | Yes | Numeric rating given by the user. |
| `maxRating` | `number` | No | Maximum possible rating on the scale. |

### 25.8 `support.article_viewed`

Fired when a user views a help center or knowledge base article.

**When to fire:** When a support article is rendered and visible to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `articleId` | `string` | Yes | Unique identifier for the article. |
| `articleTitle` | `string` | No | Title of the article viewed. |
| `category` | `string` | No | Category or section the article belongs to. |
| `source` | `string` | No | How the user arrived at the article: `"search"`, `"browse"`, `"suggestion"`, `"ticket"`. |

### 25.9 `support.article_helpful`

Fired when a user indicates whether a help center article was helpful or not.

**When to fire:** When the user clicks a "Was this helpful?" button on a support article.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `articleId` | `string` | Yes | Unique identifier for the article. |
| `isHelpful` | `boolean` | Yes | Whether the user found the article helpful. |
| `feedbackText` | `string` | No | Optional text feedback provided by the user. |

### 25.10 `support.ticket_escalated`

Fired when a support ticket is escalated to a higher tier or team.

**When to fire:** When a support ticket is moved to a higher support tier, specialist team, or supervisor.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ticketId` | `string` | Yes | Unique identifier for the support ticket. |
| `previousTier` | `string` | No | The previous support tier. |
| `newTier` | `string` | Yes | The new support tier after escalation. |
| `escalatedBy` | `string` | No | Who initiated the escalation: `"agent"`, `"system"`, `"customer"`. |
| `reason` | `string` | No | The reason for escalation. |
| `priority` | `string` | No | The priority of the escalated ticket: `"critical"`, `"high"`, `"medium"`, `"low"`, `"none"`. |

---

## 26. Communication Events

Communication events track messaging and email interactions, including in-app messages, chat conversations, and email lifecycle events.

### 26.1 `communication.message_sent`

Fired when a user sends a message through a chat, messaging, or in-app channel.

**When to fire:** When a message is dispatched through any communication channel.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `messageId` | `string` | No | Unique identifier for the message. |
| `channel` | `string` | Yes | Communication channel used to send the message: `"chat"`, `"messaging"`, `"in_app"`. |
| `conversationId` | `string` | No | Identifier for the conversation thread. |
| `hasAttachment` | `boolean` | No | Whether the message includes a file attachment. |
| `hasMedia` | `boolean` | No | Whether the message includes media such as images or videos. |

### 26.2 `communication.message_received`

Fired when a user receives a message through a communication channel.

**When to fire:** When a message is delivered to the user's inbox or conversation.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `messageId` | `string` | No | Unique identifier for the message. |
| `channel` | `string` | Yes | Communication channel through which the message was received. |
| `conversationId` | `string` | No | Identifier for the conversation thread. |
| `senderId` | `string` | No | Identifier of the message sender. |

### 26.3 `communication.message_read`

Fired when a user reads or views a received message.

**When to fire:** When a message is opened and visible to the recipient.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `messageId` | `string` | Yes | Unique identifier for the message. |
| `channel` | `string` | No | Communication channel of the message. |
| `conversationId` | `string` | No | Identifier for the conversation thread. |
| `timeSinceSent` | `number` | No | Time since message was sent in seconds. |

### 26.4 `communication.email_sent`

Fired when an email is sent to one or more recipients.

**When to fire:** When the email system dispatches an email.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `emailId` | `string` | No | Unique identifier for the email. |
| `templateId` | `string` | No | Identifier of the email template used. |
| `templateName` | `string` | No | Name of the email template used. |
| `campaignId` | `string` | No | Identifier of the associated email campaign. |
| `subject` | `string` | No | Subject line of the email. |
| `recipientCount` | `integer` | No | Number of recipients the email was sent to. |

### 26.5 `communication.email_opened`

Fired when a recipient opens an email.

**When to fire:** When the email tracking pixel is loaded or an open event is detected.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `emailId` | `string` | Yes | Unique identifier for the email. |
| `templateId` | `string` | No | Identifier of the email template used. |
| `campaignId` | `string` | No | Identifier of the associated email campaign. |
| `timeSinceSent` | `number` | No | Time since sent in seconds. |

### 26.6 `communication.email_clicked`

Fired when a recipient clicks a link within an email.

**When to fire:** When a tracked link within an email is clicked by the recipient.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `emailId` | `string` | Yes | Unique identifier for the email. |
| `linkUrl` | `string` | No | URL of the link that was clicked. |
| `linkId` | `string` | No | Identifier of the specific link within the email. |
| `campaignId` | `string` | No | Identifier of the associated email campaign. |

### 26.7 `communication.email_bounced`

Fired when an email fails to deliver and bounces back.

**When to fire:** When the email system receives a bounce notification.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `emailId` | `string` | Yes | Unique identifier for the email. |
| `bounceType` | `string` | No | Type of email bounce: `"hard"`, `"soft"`, `"block"`. |
| `reason` | `string` | No | Reason or error message for the bounce. |

### 26.8 `communication.email_unsubscribed`

Fired when a recipient unsubscribes from an email list or campaign.

**When to fire:** When the user clicks an unsubscribe link or manages their email preferences to opt out.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `emailId` | `string` | No | Unique identifier for the email that triggered the unsubscribe. |
| `listId` | `string` | No | Identifier of the mailing list unsubscribed from. |
| `listName` | `string` | No | Name of the mailing list unsubscribed from. |
| `reason` | `string` | No | Reason provided by the user for unsubscribing. |
| `campaignId` | `string` | No | Identifier of the associated email campaign. |

---

## 27. Scheduling Events

Scheduling events track appointment booking, rescheduling, cancellation, and completion. These events support scheduling analytics and appointment funnel tracking.

### 27.1 `scheduling.appointment_booked`

Fired when a user books a new appointment or reservation.

**When to fire:** When the appointment is confirmed in the scheduling system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `appointmentId` | `string` | Yes | Unique identifier for the appointment. |
| `appointmentType` | `string` | No | Type or category of the appointment. |
| `providerId` | `string` | No | Identifier of the service provider. |
| `providerName` | `string` | No | Name of the service provider. |
| `startTime` | `string` | Yes | Scheduled start time of the appointment. |
| `endTime` | `string` | No | Scheduled end time of the appointment. |
| `duration` | `number` | No | Duration in minutes. |
| `location` | `string` | No | Location or venue of the appointment. |
| `isVirtual` | `boolean` | No | Whether the appointment is virtual or remote. |

### 27.2 `scheduling.appointment_cancelled`

Fired when a scheduled appointment is cancelled.

**When to fire:** When the cancellation is confirmed in the scheduling system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `appointmentId` | `string` | Yes | Unique identifier for the appointment. |
| `reason` | `string` | No | Reason provided for the cancellation. |
| `cancelledBy` | `string` | No | Who initiated the cancellation: `"user"`, `"provider"`, `"system"`. |
| `cancellationNotice` | `number` | No | Hours of notice before appointment. |

### 27.3 `scheduling.appointment_rescheduled`

Fired when a scheduled appointment is moved to a different time.

**When to fire:** When the rescheduled time is confirmed in the scheduling system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `appointmentId` | `string` | Yes | Unique identifier for the appointment. |
| `previousStartTime` | `string` | No | Original start time before rescheduling. |
| `newStartTime` | `string` | Yes | New start time after rescheduling. |
| `newEndTime` | `string` | No | New end time for the rescheduled appointment in ISO 8601 format. |
| `rescheduledBy` | `string` | No | Who initiated the reschedule: `"user"`, `"provider"`, `"system"`. |

### 27.4 `scheduling.appointment_completed`

Fired when a scheduled appointment is completed.

**When to fire:** When the appointment is marked as completed in the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `appointmentId` | `string` | Yes | Unique identifier for the appointment. |
| `appointmentType` | `string` | No | Type or category of the appointment. |
| `duration` | `number` | No | Actual duration of the appointment in minutes. |
| `providerId` | `string` | No | Identifier of the service provider. |
| `noShow` | `boolean` | No | Whether the user did not show up for the appointment. |

### 27.5 `scheduling.reminder_sent`

Fired when a reminder notification is sent to a user about an upcoming appointment.

**When to fire:** When the system sends an automated reminder before a scheduled appointment.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `appointmentId` | `string` | Yes | Unique identifier for the appointment. |
| `channel` | `string` | No | Channel through which the reminder was sent: `"email"`, `"sms"`, `"push"`, `"in_app"`. |
| `reminderType` | `string` | No | Predefined reminder interval: `"1_day"`, `"1_hour"`, `"15_min"`, `"custom"`. |
| `timeBefore` | `number` | No | Minutes before appointment. |

### 27.6 `scheduling.availability_checked`

Fired when a user checks available appointment slots for a provider or service.

**When to fire:** When a user queries the scheduling system for available time slots.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `providerId` | `string` | No | Identifier of the service provider. |
| `providerType` | `string` | No | Type or specialty of the provider. |
| `dateRange` | `string` | No | Date range queried for availability. |
| `slotsAvailable` | `integer` | No | Number of available time slots found. |
| `slotsViewed` | `integer` | No | Number of available time slots the user viewed. |

---

## 28. Marketplace Events

Marketplace events track listing lifecycle, offers, and buyer-seller interactions in two-sided marketplace platforms.

### 28.1 `marketplace.listing_created`

Fired when a new marketplace listing is created by a seller.

**When to fire:** When a seller saves a new listing, whether as a draft or published.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `title` | `string` | No | Title of the listing. |
| `category` | `string` | No | Category the listing belongs to. |
| `price` | `number` | No | Listed price of the item. |
| `currency` | `string` | No | Currency code for the price. |
| `sellerId` | `string` | No | Unique identifier for the seller. |
| `condition` | `string` | No | Condition of the listed item: `"new"`, `"used"`, `"refurbished"`, `"other"`. |

### 28.2 `marketplace.listing_updated`

Fired when an existing marketplace listing is updated.

**When to fire:** When a seller modifies any details of an existing listing.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `updatedFields` | `string[]` | No | List of field names that were updated. |
| `previousPrice` | `number` | No | Price before the update. |
| `newPrice` | `number` | No | Price after the update. |

### 28.3 `marketplace.listing_published`

Fired when a marketplace listing is published and made visible to buyers.

**When to fire:** When a listing transitions from draft to a publicly visible state.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `title` | `string` | No | Title of the listing. |
| `category` | `string` | No | Category the listing belongs to. |
| `price` | `number` | No | Published price of the item. |
| `currency` | `string` | No | Currency code for the price. |

### 28.4 `marketplace.listing_removed`

Fired when a marketplace listing is removed or taken down.

**When to fire:** When a listing is removed from the marketplace, whether by the seller, the platform, or automatically.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `reason` | `string` | No | Reason the listing was removed: `"sold"`, `"expired"`, `"user"`, `"policy"`, `"other"`. |

### 28.5 `marketplace.offer_made`

Fired when a buyer makes an offer on a marketplace listing.

**When to fire:** When a buyer submits an offer for a listing.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `offerId` | `string` | Yes | Unique identifier for the offer. |
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `amount` | `number` | Yes | Offer amount. |
| `currency` | `string` | No | Currency code for the offer amount. |
| `message` | `string` | No | Optional message from the buyer. |
| `expiresAt` | `string` | No | Expiration date and time of the offer. |

### 28.6 `marketplace.offer_accepted`

Fired when a seller accepts an offer on a marketplace listing.

**When to fire:** When a seller confirms acceptance of a buyer's offer.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `offerId` | `string` | Yes | Unique identifier for the offer. |
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `amount` | `number` | Yes | Accepted offer amount. |
| `currency` | `string` | No | Currency code for the offer amount. |

### 28.7 `marketplace.offer_rejected`

Fired when a seller rejects an offer on a marketplace listing.

**When to fire:** When a seller declines a buyer's offer.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `offerId` | `string` | Yes | Unique identifier for the offer. |
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `reason` | `string` | No | Reason the offer was rejected. |

### 28.8 `marketplace.seller_contacted`

Fired when a buyer contacts a seller about a marketplace listing.

**When to fire:** When a buyer initiates communication with a seller through any channel.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `listingId` | `string` | Yes | Unique identifier for the listing. |
| `sellerId` | `string` | No | Unique identifier for the seller. |
| `method` | `string` | No | Contact method used: `"message"`, `"email"`, `"phone"`, `"chat"`. |
| `subject` | `string` | No | Subject or topic of the contact. |

### 28.9 `marketplace.dispute_opened`

Fired when a dispute is opened between buyer and seller on a marketplace.

**When to fire:** When a buyer, seller, or the platform initiates a formal dispute over an order.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `disputeId` | `string` | Yes | Unique identifier for the dispute. |
| `orderId` | `string` | No | The order or transaction identifier related to the dispute. |
| `listingId` | `string` | No | The listing identifier related to the dispute. |
| `reason` | `string` | Yes | The reason for the dispute: `"item_not_received"`, `"item_not_as_described"`, `"unauthorized_purchase"`, `"billing_error"`, `"quality_issue"`, `"counterfeit"`, `"other"`. |
| `disputeType` | `string` | No | The type of dispute resolution requested: `"refund"`, `"replacement"`, `"mediation"`, `"chargeback"`. |
| `amount` | `number` | No | The monetary amount in dispute. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `initiatedBy` | `string` | No | The party that opened the dispute: `"buyer"`, `"seller"`, `"platform"`. |
| `description` | `string` | No | Free-text description of the dispute. |

### 28.10 `marketplace.dispute_resolved`

Fired when a marketplace dispute is resolved.

**When to fire:** When a dispute reaches a final resolution, whether by agreement, mediation, or platform decision.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `disputeId` | `string` | Yes | Unique identifier for the dispute. |
| `orderId` | `string` | No | The order or transaction identifier related to the dispute. |
| `resolution` | `string` | Yes | The resolution outcome: `"refunded"`, `"replaced"`, `"dismissed"`, `"escalated"`, `"partial_refund"`, `"mediated"`. |
| `resolvedBy` | `string` | No | The party that resolved the dispute: `"buyer"`, `"seller"`, `"platform"`, `"automatic"`. |
| `resolutionAmount` | `number` | No | The monetary amount of the resolution (e.g. refund amount). |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `durationSeconds` | `number` | No | Time from dispute opened to resolution in seconds. |

---

## 29. Education Events

Education events track learning and course management activities, including enrollment, lesson progress, quizzes, and certification.

### 29.1 `education.course_enrolled`

Fired when a user enrolls in a course.

**When to fire:** When enrollment is confirmed and the user gains access to the course.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `courseId` | `string` | Yes | Unique identifier for the course. |
| `courseName` | `string` | No | Name of the course. |
| `instructorId` | `string` | No | Unique identifier for the instructor. |
| `instructorName` | `string` | No | Name of the instructor. |
| `enrollmentType` | `string` | No | Type of enrollment: `"free"`, `"paid"`, `"trial"`, `"scholarship"`. |
| `price` | `number` | No | Price paid for enrollment. |
| `currency` | `string` | No | Currency code for the price. |

### 29.2 `education.course_started`

Fired when a user starts a course for the first time.

**When to fire:** When the user begins the first lesson or content of a course.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `courseId` | `string` | Yes | Unique identifier for the course. |
| `courseName` | `string` | No | Name of the course. |
| `totalLessons` | `integer` | No | Total number of lessons in the course. |
| `totalDuration` | `number` | No | Total course duration in minutes. |

### 29.3 `education.course_completed`

Fired when a user completes all required lessons in a course.

**When to fire:** When the user finishes the final required lesson or meets the course completion criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `courseId` | `string` | Yes | Unique identifier for the course. |
| `courseName` | `string` | No | Name of the course. |
| `completionTime` | `number` | No | Time to complete in minutes. |
| `lessonsCompleted` | `integer` | No | Number of lessons completed. |
| `finalScore` | `number` | No | Final score achieved in the course. |
| `certificateEarned` | `boolean` | No | Whether a certificate was earned upon completion. |

### 29.4 `education.lesson_started`

Fired when a user starts a lesson within a course.

**When to fire:** When the user opens and begins consuming a lesson's content.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `lessonId` | `string` | Yes | Unique identifier for the lesson. |
| `lessonName` | `string` | No | Name of the lesson. |
| `courseId` | `string` | No | Unique identifier for the parent course. |
| `lessonNumber` | `integer` | No | Sequential number of the lesson within the course. |
| `lessonType` | `string` | No | Type of lesson content: `"video"`, `"text"`, `"interactive"`, `"quiz"`, `"assignment"`, `"live"`. |

### 29.5 `education.lesson_completed`

Fired when a user completes a lesson within a course.

**When to fire:** When the user finishes a lesson, whether by reaching the end of the content or meeting completion criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `lessonId` | `string` | Yes | Unique identifier for the lesson. |
| `lessonName` | `string` | No | Name of the lesson. |
| `courseId` | `string` | No | Unique identifier for the parent course. |
| `duration` | `number` | No | Time spent in minutes. |
| `score` | `number` | No | Score achieved in the lesson. |
| `passed` | `boolean` | No | Whether the user passed the lesson. |

### 29.6 `education.quiz_started`

Fired when a user starts a quiz.

**When to fire:** When the user begins answering quiz questions.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `quizId` | `string` | Yes | Unique identifier for the quiz. |
| `quizName` | `string` | No | Name of the quiz. |
| `courseId` | `string` | No | Unique identifier for the parent course. |
| `lessonId` | `string` | No | Unique identifier for the parent lesson. |
| `questionCount` | `integer` | No | Total number of questions in the quiz. |
| `timeLimit` | `number` | No | Time limit in seconds. |
| `attemptNumber` | `integer` | No | Which attempt number this is for the user. |

### 29.7 `education.quiz_completed`

Fired when a user completes a quiz and results are available.

**When to fire:** When the user submits the quiz and the score is calculated.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `quizId` | `string` | Yes | Unique identifier for the quiz. |
| `quizName` | `string` | No | Name of the quiz. |
| `courseId` | `string` | No | Unique identifier for the parent course. |
| `score` | `number` | Yes | Score achieved on the quiz. |
| `maxScore` | `number` | No | Maximum possible score. |
| `passed` | `boolean` | No | Whether the user passed the quiz. |
| `duration` | `number` | No | Time taken in seconds. |
| `correctAnswers` | `integer` | No | Number of correct answers. |
| `totalQuestions` | `integer` | No | Total number of questions. |

### 29.8 `education.certificate_earned`

Fired when a user earns a certificate upon completing a course.

**When to fire:** When the certificate is issued to the user after meeting the certification criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `certificateId` | `string` | Yes | Unique identifier for the certificate. |
| `courseId` | `string` | Yes | Unique identifier for the course. |
| `courseName` | `string` | No | Name of the course. |
| `issuedAt` | `string` | No | Date and time the certificate was issued. |
| `expiresAt` | `string` | No | Date and time the certificate expires. |
| `credentialUrl` | `string` | No | URL to verify or view the credential. |

---

## 30. Gaming Events

Gaming events track gameplay progress, achievements, in-game item interactions, leaderboards, and challenges. These events support game analytics, player engagement tracking, and monetization analysis.

### 30.1 `gaming.level_started`

Fired when a player starts a game level.

**When to fire:** When the player enters and begins playing a level.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `levelId` | `string` | Yes | Unique identifier for the level. |
| `levelName` | `string` | No | Name of the level. |
| `levelNumber` | `integer` | No | Sequential number of the level. |
| `difficulty` | `string` | No | Difficulty setting of the level: `"easy"`, `"medium"`, `"hard"`, `"expert"`. |
| `attempts` | `integer` | No | Number of previous attempts at this level. |

### 30.2 `gaming.level_completed`

Fired when a player completes a game level.

**When to fire:** When the player reaches the end of a level and meets the completion criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `levelId` | `string` | Yes | Unique identifier for the level. |
| `levelName` | `string` | No | Name of the level. |
| `levelNumber` | `integer` | No | Sequential number of the level. |
| `score` | `number` | No | Score achieved on the level. |
| `stars` | `integer` | No | Star rating earned. |
| `duration` | `number` | No | Completion time in seconds. |
| `isFirstCompletion` | `boolean` | No | Whether this is the first time the player completed this level. |
| `isPerfect` | `boolean` | No | Whether the player achieved a perfect score or run. |

### 30.3 `gaming.achievement_unlocked`

Fired when a player unlocks an achievement.

**When to fire:** When the achievement criteria are met and the achievement is awarded.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `achievementId` | `string` | Yes | Unique identifier for the achievement. |
| `achievementName` | `string` | No | Name of the achievement. |
| `category` | `string` | No | Category the achievement belongs to. |
| `points` | `number` | No | Point value of the achievement. |
| `rarity` | `string` | No | Rarity tier of the achievement: `"common"`, `"uncommon"`, `"rare"`, `"epic"`, `"legendary"`. |
| `isSecret` | `boolean` | No | Whether the achievement was hidden before being unlocked. |

### 30.4 `gaming.item_acquired`

Fired when a player acquires an in-game item.

**When to fire:** When an item is added to the player's inventory through any means.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | `string` | Yes | Unique identifier for the item. |
| `itemName` | `string` | No | Name of the item. |
| `itemType` | `string` | No | Type of item acquired: `"weapon"`, `"armor"`, `"consumable"`, `"cosmetic"`, `"currency"`, `"material"`, `"other"`. |
| `rarity` | `string` | No | Rarity tier of the item. |
| `source` | `string` | No | How the item was acquired: `"purchase"`, `"drop"`, `"reward"`, `"craft"`, `"trade"`, `"gift"`. |
| `quantity` | `integer` | No | Number of items acquired. |
| `virtualCurrencyCost` | `number` | No | Cost in virtual currency. |
| `realCurrencyCost` | `number` | No | Cost in real currency. |
| `currency` | `string` | No | Currency code for real currency cost. |

### 30.5 `gaming.item_used`

Fired when a player uses an in-game item.

**When to fire:** When an item is consumed or activated from the player's inventory.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | `string` | Yes | Unique identifier for the item. |
| `itemName` | `string` | No | Name of the item. |
| `itemType` | `string` | No | Type of item used. |
| `context` | `string` | No | Context in which the item was used. |
| `quantity` | `integer` | No | Number of items used. |

### 30.6 `gaming.score_posted`

Fired when a player posts a score to a leaderboard.

**When to fire:** When a score is submitted and recorded on a leaderboard.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `score` | `number` | Yes | Score value posted. |
| `leaderboardId` | `string` | No | Unique identifier for the leaderboard. |
| `leaderboardName` | `string` | No | Name of the leaderboard. |
| `rank` | `integer` | No | Player's rank on the leaderboard. |
| `levelId` | `string` | No | Unique identifier for the level the score was achieved on. |
| `isPersonalBest` | `boolean` | No | Whether this score is a new personal best. |

### 30.7 `gaming.challenge_started`

Fired when a player starts a challenge.

**When to fire:** When the player enters and begins a challenge event.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `challengeId` | `string` | Yes | Unique identifier for the challenge. |
| `challengeName` | `string` | No | Name of the challenge. |
| `challengeType` | `string` | No | Type of challenge: `"daily"`, `"weekly"`, `"seasonal"`, `"special"`, `"pvp"`, `"pve"`. |
| `difficulty` | `string` | No | Difficulty setting of the challenge. |

### 30.8 `gaming.challenge_completed`

Fired when a player completes a challenge.

**When to fire:** When the player meets the challenge completion criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `challengeId` | `string` | Yes | Unique identifier for the challenge. |
| `challengeName` | `string` | No | Name of the challenge. |
| `challengeType` | `string` | No | Type of challenge. |
| `score` | `number` | No | Score achieved in the challenge. |
| `reward` | `string` | No | Reward earned for completing the challenge. |
| `duration` | `number` | No | Time to complete in seconds. |
| `isFirstCompletion` | `boolean` | No | Whether this is the first time the player completed this challenge. |

### 30.9 `gaming.currency_earned`

Fired when a player earns virtual currency in a game.

**When to fire:** When virtual currency is added to the player's balance through any in-game mechanism.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `currencyName` | `string` | Yes | Name of the virtual currency (e.g. 'coins', 'gems', 'gold'). |
| `amount` | `number` | Yes | Amount of currency earned. |
| `source` | `string` | No | How the currency was earned: `"purchase"`, `"reward"`, `"quest"`, `"daily_login"`, `"achievement"`, `"referral"`, `"promotion"`, `"other"`. |
| `balance` | `number` | No | Balance after earning. |
| `level` | `integer` | No | Player's current level. |
| `gameMode` | `string` | No | Current game mode. |

### 30.10 `gaming.currency_spent`

Fired when a player spends virtual currency in a game.

**When to fire:** When virtual currency is deducted from the player's balance for an in-game purchase or action.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `currencyName` | `string` | Yes | Name of the virtual currency (e.g. 'coins', 'gems', 'gold'). |
| `amount` | `number` | Yes | Amount of currency spent. |
| `itemName` | `string` | No | The item or service purchased with the currency. |
| `itemCategory` | `string` | No | Category of the item purchased. |
| `balance` | `number` | No | Balance after spending. |
| `level` | `integer` | No | Player's current level. |
| `gameMode` | `string` | No | Current game mode. |

---

## 31. CRM Events

CRM events track the sales pipeline lifecycle, from lead generation through qualification, opportunity management, demos, and contract execution.

### 31.1 `crm.lead_created`

Fired when a new lead is created in the CRM system.

**When to fire:** When a new lead record is created, whether from form submission, import, or system action.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `leadId` | `string` | Yes | Unique identifier for the lead. |
| `source` | `string` | No | Source channel that generated the lead: `"organic"`, `"paid"`, `"referral"`, `"social"`, `"email"`, `"partner"`, `"event"`, `"other"`. |
| `channel` | `string` | No | Specific channel or sub-source. |
| `campaignId` | `string` | No | Unique identifier for the associated campaign. |
| `score` | `number` | No | Initial lead score. |

### 31.2 `crm.lead_qualified`

Fired when a lead is qualified and meets the criteria for further engagement.

**When to fire:** When a lead meets the qualification threshold, whether through scoring, manual review, or automated criteria.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `leadId` | `string` | Yes | Unique identifier for the lead. |
| `qualificationType` | `string` | No | Type of qualification applied: `"mql"`, `"sql"`, `"pql"`, `"manual"`. |
| `score` | `number` | No | Lead score at time of qualification. |
| `criteria` | `string[]` | No | List of criteria that were met for qualification. |

### 31.3 `crm.lead_converted`

Fired when a lead is converted to an opportunity, customer, or account.

**When to fire:** When a lead record is converted to a downstream entity in the CRM.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `leadId` | `string` | Yes | Unique identifier for the lead. |
| `convertedTo` | `string` | No | Entity type the lead was converted to: `"opportunity"`, `"customer"`, `"account"`. |
| `conversionValue` | `number` | No | Estimated value of the conversion. |
| `currency` | `string` | No | Currency code for the conversion value. |
| `timeToConvert` | `number` | No | Time from creation to conversion in hours. |

### 31.4 `crm.opportunity_created`

Fired when a new sales opportunity is created.

**When to fire:** When a new opportunity record is created in the CRM pipeline.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `opportunityId` | `string` | Yes | Unique identifier for the opportunity. |
| `name` | `string` | No | Name of the opportunity. |
| `stage` | `string` | No | Current pipeline stage. |
| `value` | `number` | No | Estimated deal value. |
| `currency` | `string` | No | Currency code for the deal value. |
| `probability` | `number` | No | Win probability 0-100. |
| `expectedCloseDate` | `string` | No | Expected date the deal will close. |
| `ownerId` | `string` | No | Unique identifier for the opportunity owner. |

### 31.5 `crm.opportunity_updated`

Fired when an existing sales opportunity is updated.

**When to fire:** When any meaningful changes are made to an opportunity record, such as stage progression or value change.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `opportunityId` | `string` | Yes | Unique identifier for the opportunity. |
| `previousStage` | `string` | No | Pipeline stage before the update. |
| `newStage` | `string` | No | Pipeline stage after the update. |
| `previousValue` | `number` | No | Deal value before the update. |
| `newValue` | `number` | No | Deal value after the update. |
| `updatedFields` | `string[]` | No | List of field names that were updated. |

### 31.6 `crm.opportunity_won`

Fired when a sales opportunity is closed as won.

**When to fire:** When a deal is marked as closed-won in the CRM.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `opportunityId` | `string` | Yes | Unique identifier for the opportunity. |
| `value` | `number` | Yes | Final deal value. |
| `currency` | `string` | No | Currency code for the deal value. |
| `timeToClose` | `number` | No | Time from creation to close in days. |
| `products` | `object[]` | No | Products included in the deal. Each item may include `id` (string), `name` (string), and `value` (number). |

### 31.7 `crm.opportunity_lost`

Fired when a sales opportunity is closed as lost.

**When to fire:** When a deal is marked as closed-lost in the CRM.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `opportunityId` | `string` | Yes | Unique identifier for the opportunity. |
| `value` | `number` | No | Deal value at time of loss. |
| `currency` | `string` | No | Currency code for the deal value. |
| `reason` | `string` | No | Reason the opportunity was lost: `"price"`, `"competitor"`, `"timing"`, `"no_budget"`, `"no_need"`, `"no_response"`, `"other"`. |
| `competitor` | `string` | No | Name or identifier of the competitor that won. |
| `timeToLose` | `number` | No | Time from creation to loss in days. |

### 31.8 `crm.demo_requested`

Fired when a prospect requests a product demo.

**When to fire:** When a demo request form is submitted or a demo request is recorded.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `demoId` | `string` | No | Unique identifier for the demo request. |
| `leadId` | `string` | No | Unique identifier for the associated lead. |
| `product` | `string` | No | Product the demo is requested for. |
| `preferredDate` | `string` | No | Preferred date and time for the demo. |
| `companySize` | `string` | No | Size of the requesting company: `"1-10"`, `"11-50"`, `"51-200"`, `"201-1000"`, `"1000+"`. |

### 31.9 `crm.demo_scheduled`

Fired when a product demo is scheduled with a prospect.

**When to fire:** When a demo is confirmed and added to the calendar.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `demoId` | `string` | Yes | Unique identifier for the demo. |
| `leadId` | `string` | No | Unique identifier for the associated lead. |
| `scheduledAt` | `string` | Yes | Scheduled date and time of the demo. |
| `duration` | `number` | No | Scheduled duration in minutes. |
| `product` | `string` | No | Product being demonstrated. |
| `presenterId` | `string` | No | Unique identifier for the presenter. |

### 31.10 `crm.demo_completed`

Fired when a product demo is completed.

**When to fire:** When the demo session ends and the outcome is recorded.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `demoId` | `string` | Yes | Unique identifier for the demo. |
| `leadId` | `string` | No | Unique identifier for the associated lead. |
| `duration` | `number` | No | Actual duration in minutes. |
| `attendeeCount` | `integer` | No | Number of attendees in the demo. |
| `outcome` | `string` | No | Outcome of the demo: `"interested"`, `"not_interested"`, `"follow_up"`, `"deal_created"`. |
| `followUpDate` | `string` | No | Date for follow-up after the demo. |

### 31.11 `crm.contract_sent`

Fired when a contract is sent to a prospect for review and signature.

**When to fire:** When the contract document is dispatched to the prospect.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contractId` | `string` | Yes | Unique identifier for the contract. |
| `opportunityId` | `string` | No | Unique identifier for the associated opportunity. |
| `value` | `number` | No | Contract value. |
| `currency` | `string` | No | Currency code for the contract value. |
| `expiresAt` | `string` | No | Date and time the contract offer expires. |

### 31.12 `crm.contract_signed`

Fired when a contract is signed by the customer.

**When to fire:** When the signed contract is received and recorded in the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `contractId` | `string` | Yes | Unique identifier for the contract. |
| `opportunityId` | `string` | No | Unique identifier for the associated opportunity. |
| `value` | `number` | Yes | Signed contract value. |
| `currency` | `string` | No | Currency code for the contract value. |
| `signedAt` | `string` | No | Date and time the contract was signed. |
| `termLength` | `integer` | No | Contract term in months. |

---

## 32. App Events

App events track mobile and desktop application lifecycle, including installation, updates, foreground/background transitions, crashes, and deep linking.

### 32.1 `app.installed`

Fired when a user installs the application.

**When to fire:** On the first launch of the application after installation.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | `string` | No | The version of the app that was installed. |
| `platform` | `string` | No | The platform the app was installed on: `"ios"`, `"android"`, `"web"`, `"desktop"`. |
| `source` | `string` | No | The source of the installation: `"app_store"`, `"play_store"`, `"direct"`, `"referral"`, `"ad"`. |
| `campaignId` | `string` | No | The campaign identifier that led to the install, if any. |

### 32.2 `app.opened`

Fired when a user opens the application.

**When to fire:** On each app launch, whether from a cold start or a warm start.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | `string` | No | The version of the app that was opened. |
| `isFirstOpen` | `boolean` | No | Whether this is the first time the user has opened the app. |
| `openedFrom` | `string` | No | How the app was opened: `"direct"`, `"push_notification"`, `"deep_link"`, `"widget"`, `"shortcut"`. |
| `referringUrl` | `string` | No | The URL that referred the user to open the app, if any. |

### 32.3 `app.backgrounded`

Fired when the application is sent to the background.

**When to fire:** When the app transitions from the foreground to the background state.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionDuration` | `number` | No | Time app was in foreground in seconds. |
| `screenName` | `string` | No | The screen the user was on when the app was backgrounded. |

### 32.4 `app.foregrounded`

Fired when the application is brought back to the foreground.

**When to fire:** When the app transitions from the background to the foreground state.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `backgroundDuration` | `number` | No | Time app was in background in seconds. |
| `screenName` | `string` | No | The screen the user returns to when the app is foregrounded. |

### 32.5 `app.updated`

Fired when the application is updated to a new version.

**When to fire:** On the first launch after an app update is applied.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `previousVersion` | `string` | Yes | The version the app was updated from. |
| `newVersion` | `string` | Yes | The version the app was updated to. |
| `updateMethod` | `string` | No | How the update was applied: `"auto"`, `"manual"`, `"forced"`. |

### 32.6 `app.crashed`

Fired when the application crashes.

**When to fire:** On the next app launch after a crash is detected, or when the crash reporting system captures the event.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | Yes | The crash error message. |
| `stackTrace` | `string` | No | The stack trace of the crash, if available. |
| `screenName` | `string` | No | The screen the user was on when the crash occurred. |
| `isFatal` | `boolean` | No | Whether the crash was fatal. |
| `appVersion` | `string` | No | The version of the app at the time of the crash. |
| `osVersion` | `string` | No | The operating system version at the time of the crash. |

### 32.7 `app.deep_link_opened`

Fired when the application is opened via a deep link.

**When to fire:** When the app is launched or routed to a specific screen through a deep link URL.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The deep link URL that was opened. |
| `source` | `string` | No | The source that generated the deep link. |
| `campaignId` | `string` | No | The campaign identifier associated with the deep link, if any. |
| `isDeferred` | `boolean` | No | Whether the deep link was deferred (i.e. the app was not installed at the time of click). |
| `matchType` | `string` | No | The method used to match the deep link to the user: `"exact"`, `"fingerprint"`, `"default"`. |

### 32.8 `app.screen_viewed`

Fired when a user views a screen in the application.

**When to fire:** When a screen becomes visible to the user, similar to a page view in web applications.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `screenName` | `string` | Yes | The name of the screen that was viewed. |
| `screenClass` | `string` | No | The class or component name of the screen. |
| `previousScreenName` | `string` | No | The name of the previous screen. |
| `previousScreenClass` | `string` | No | The class or component name of the previous screen. |

### 32.9 `app.device_connected`

Fired when a physical device (IoT, wearable, peripheral) is paired or connected.

**When to fire:** When a device successfully establishes a connection with the app via Bluetooth, WiFi, or other protocols.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `deviceId` | `string` | Yes | Unique identifier for the connected device. |
| `deviceName` | `string` | No | Human-readable name of the device. |
| `deviceType` | `string` | No | Type of device: `"wearable"`, `"smart_home"`, `"sensor"`, `"peripheral"`, `"vehicle"`, `"appliance"`, `"other"`. |
| `connectionType` | `string` | No | Connection protocol used: `"bluetooth"`, `"wifi"`, `"usb"`, `"zigbee"`, `"zwave"`, `"thread"`, `"matter"`, `"cellular"`, `"other"`. |
| `firmwareVersion` | `string` | No | Current firmware version of the device. |
| `manufacturer` | `string` | No | Device manufacturer. |
| `model` | `string` | No | Device model name or number. |
| `batteryLevel` | `number` | No | Battery level (0-100). |
| `signalStrength` | `integer` | No | Signal strength in dBm. |

### 32.10 `app.device_disconnected`

Fired when a physical device is unpaired or disconnected.

**When to fire:** When a connected device loses connection or is manually disconnected.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `deviceId` | `string` | Yes | Unique identifier for the disconnected device. |
| `deviceName` | `string` | No | Human-readable name of the device. |
| `deviceType` | `string` | No | Type of device: `"wearable"`, `"smart_home"`, `"sensor"`, `"peripheral"`, `"vehicle"`, `"appliance"`, `"other"`. |
| `reason` | `string` | No | Reason for disconnection: `"user_initiated"`, `"timeout"`, `"out_of_range"`, `"low_battery"`, `"error"`, `"firmware_update"`, `"other"`. |
| `sessionDurationSeconds` | `number` | No | Duration the device was connected in seconds. |

### 32.11 `app.device_firmware_updated`

Fired when a connected device completes a firmware or software update.

**When to fire:** When an OTA or manual firmware update finishes on a connected device.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `deviceId` | `string` | Yes | Unique identifier for the device. |
| `deviceName` | `string` | No | Human-readable name of the device. |
| `previousVersion` | `string` | No | Firmware version before the update. |
| `newVersion` | `string` | Yes | Firmware version after the update. |
| `updateMethod` | `string` | No | How the update was applied: `"ota"`, `"usb"`, `"manual"`, `"automatic"`. |
| `durationSeconds` | `number` | No | Update duration in seconds. |
| `status` | `string` | No | Update outcome: `"success"`, `"failed"`, `"partial"`. |

---

## 33. Order Events

Order events track the post-purchase order lifecycle, from confirmation through fulfillment, delivery, returns, and cancellations.

### 33.1 `order.confirmed`

Fired when an order is confirmed.

**When to fire:** When the system confirms that an order has been successfully placed and accepted.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `total` | `number` | No | The total monetary value of the order. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `estimatedDelivery` | `string` | No | ISO 8601 date or datetime for the estimated delivery. |
| `products` | `object[]` | No | The list of products included in the order. Each item may include `id` (string), `name` (string), `quantity` (integer), and `price` (number). |
| `shippingMethod` | `string` | No | The shipping method selected for the order. |
| `shippingAddress` | `object` | No | The shipping address for the order (excludes street for privacy). May include `city` (string), `region` (string), `country` (string), and `postalCode` (string). |

### 33.2 `order.processing`

Fired when an order enters the processing stage.

**When to fire:** When the order transitions to a processing state such as picking, packing, or quality check.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `status` | `string` | No | The current processing status: `"picking"`, `"packing"`, `"quality_check"`, `"ready_to_ship"`. |
| `warehouseId` | `string` | No | Unique identifier for the warehouse handling the order. |
| `estimatedShipDate` | `string` | No | ISO 8601 date or datetime for the estimated ship date. |

### 33.3 `order.shipped`

Fired when an order is shipped.

**When to fire:** When the order leaves the warehouse and tracking information becomes available.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `carrier` | `string` | No | The name of the shipping carrier (e.g. UPS, FedEx, USPS). |
| `trackingNumber` | `string` | No | The tracking number for the shipment. |
| `trackingUrl` | `string` | No | A URL to track the shipment. |
| `estimatedDelivery` | `string` | No | ISO 8601 date or datetime for the estimated delivery. |
| `shipmentId` | `string` | No | Unique identifier for the shipment. |

### 33.4 `order.delivered`

Fired when an order is delivered.

**When to fire:** When the delivery is confirmed, either through carrier confirmation or customer acknowledgment.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `deliveredAt` | `string` | No | ISO 8601 datetime when the order was delivered. |
| `signedBy` | `string` | No | The name of the person who signed for the delivery. |
| `deliveryMethod` | `string` | No | The method used for delivery: `"standard"`, `"express"`, `"same_day"`, `"pickup"`, `"locker"`. |
| `deliveryDuration` | `number` | No | Time from order to delivery in hours. |

### 33.5 `order.return_requested`

Fired when a return is requested for an order.

**When to fire:** When a customer initiates a return request through the return flow.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `reason` | `string` | No | The reason for requesting the return: `"defective"`, `"wrong_item"`, `"not_as_described"`, `"changed_mind"`, `"too_late"`, `"other"`. |
| `products` | `object[]` | No | The list of products being returned. Each item may include `id` (string), `name` (string), and `quantity` (integer). |
| `returnMethod` | `string` | No | The method used to return the products: `"mail"`, `"in_store"`, `"pickup"`. |
| `comments` | `string` | No | Additional comments provided by the customer about the return. |

### 33.6 `order.returned`

Fired when an order return is completed.

**When to fire:** When the returned products are received and the refund is processed.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `refundAmount` | `number` | No | The monetary amount refunded for the return. |
| `refundMethod` | `string` | No | The method used to issue the refund: `"original_payment"`, `"store_credit"`, `"exchange"`. |
| `products` | `object[]` | No | The list of products that were returned. Each item may include `id` (string), `name` (string), and `quantity` (integer). |
| `returnId` | `string` | No | Unique identifier for the return. |

### 33.7 `order.cancelled`

Fired when an order is cancelled.

**When to fire:** When an order is cancelled before fulfillment, whether by the customer, merchant, or system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | `string` | Yes | Unique identifier for the order. |
| `reason` | `string` | No | The reason for cancelling the order: `"customer_request"`, `"out_of_stock"`, `"payment_failed"`, `"fraud_detected"`, `"other"`. |
| `cancelledBy` | `string` | No | The party that initiated the cancellation: `"customer"`, `"merchant"`, `"system"`. |
| `refundAmount` | `number` | No | The monetary amount refunded due to the cancellation. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |

---

## 34. Account Events

Account events track account lifecycle management, including creation, suspension, reactivation, deletion, settings changes, and team membership.

### 34.1 `account.created`

Fired when a new account is created.

**When to fire:** When a new organizational or team account is provisioned in the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `accountName` | `string` | No | Human-readable name of the account. |
| `plan` | `string` | No | The plan associated with the account. |
| `accountType` | `string` | No | The type of account created: `"personal"`, `"team"`, `"enterprise"`. |
| `createdBy` | `string` | No | Identifier of the user who created the account. |

### 34.2 `account.suspended`

Fired when an account is suspended.

**When to fire:** When an account is suspended due to billing failure, policy violation, or other reasons.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `reason` | `string` | No | The reason for suspending the account: `"billing_failure"`, `"terms_violation"`, `"inactivity"`, `"security"`, `"manual"`. |
| `suspendedBy` | `string` | No | The party that initiated the suspension: `"system"`, `"admin"`. |

### 34.3 `account.reactivated`

Fired when a previously inactive account is reactivated.

**When to fire:** When a suspended, cancelled, or expired account is restored to active status.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `previousStatus` | `string` | No | The status the account was in before reactivation: `"suspended"`, `"cancelled"`, `"expired"`. |
| `reactivatedBy` | `string` | No | The party that initiated the reactivation: `"customer"`, `"admin"`, `"system"`. |

### 34.4 `account.deleted`

Fired when an account is deleted.

**When to fire:** When an account is permanently or soft-deleted from the system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `reason` | `string` | No | The reason for deleting the account: `"customer_request"`, `"inactivity"`, `"terms_violation"`, `"other"`. |
| `deletedBy` | `string` | No | The party that initiated the deletion: `"customer"`, `"admin"`, `"system"`. |
| `retentionDays` | `integer` | No | Number of days data will be retained before permanent deletion. |

### 34.5 `account.settings_updated`

Fired when account settings are updated.

**When to fire:** When any account-level setting is changed, such as billing, security, notification, or branding preferences.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `updatedFields` | `string[]` | No | The list of settings fields that were updated. |
| `category` | `string` | No | The category of settings that were updated: `"billing"`, `"security"`, `"notifications"`, `"preferences"`, `"branding"`, `"other"`. |

### 34.6 `account.team_member_added`

Fired when a new team member is added to an account.

**When to fire:** When a user is invited or added as a member of an organizational account.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `memberId` | `string` | No | Unique identifier for the new team member. |
| `role` | `string` | No | The role assigned to the new team member: `"owner"`, `"admin"`, `"member"`, `"viewer"`, `"billing"`. |
| `inviteMethod` | `string` | No | The method used to invite the team member: `"email"`, `"link"`, `"sso"`, `"api"`. |

### 34.7 `account.seat_added`

Fired when a seat or license is provisioned for a user in a B2B account.

**When to fire:** When a new seat is allocated from the account's license pool, granting a user access.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `seatId` | `string` | No | Unique identifier for the seat or license. |
| `userId` | `string` | No | Unique identifier of the user assigned the seat. |
| `role` | `string` | No | Role assigned to the seat. |
| `licenseType` | `string` | No | Type of license (e.g. 'standard', 'admin', 'viewer'). |
| `totalSeats` | `integer` | No | Total seats available on the account. |
| `usedSeats` | `integer` | No | Number of seats currently in use. |
| `plan` | `string` | No | The account plan. |

### 34.8 `account.seat_removed`

Fired when a seat or license is deprovisioned from a user in a B2B account.

**When to fire:** When a seat is released back to the account's license pool, revoking a user's access.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | Yes | Unique identifier for the account. |
| `seatId` | `string` | No | Unique identifier for the seat or license. |
| `userId` | `string` | No | Unique identifier of the user whose seat was removed. |
| `reason` | `string` | No | Reason for removal: `"offboarding"`, `"downgrade"`, `"cost_reduction"`, `"inactivity"`, `"other"`. |
| `totalSeats` | `integer` | No | Total seats available on the account. |
| `usedSeats` | `integer` | No | Number of seats currently in use. |
| `plan` | `string` | No | The account plan. |

---

## 35. Privacy Events

Privacy events track data privacy operations, including data export requests, data deletion requests, and consent record creation. These events support compliance with privacy regulations such as GDPR, CCPA, and LGPD.

### 35.1 `privacy.data_export_requested`

Fired when a user requests an export of their personal data.

**When to fire:** When a user submits a data subject access request (DSAR) or data portability request.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | `string` | Yes | Unique identifier for the data export request. |
| `userId` | `string` | No | Unique identifier for the user requesting the export. |
| `dataTypes` | `string[]` | No | List of data types included in the export (e.g. profile, activity, purchases). |
| `format` | `string` | No | The file format for the exported data: `"json"`, `"csv"`, `"xml"`. |
| `regulation` | `string` | No | The privacy regulation under which the export was requested: `"gdpr"`, `"ccpa"`, `"lgpd"`, `"other"`. |

### 35.2 `privacy.data_export_completed`

Fired when a data export request has been fulfilled and the export is ready.

**When to fire:** When the system finishes generating the data export file and it is available for download.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | `string` | Yes | Unique identifier for the data export request. |
| `userId` | `string` | No | Unique identifier for the user whose data was exported. |
| `format` | `string` | No | The file format of the exported data: `"json"`, `"csv"`, `"xml"`. |
| `fileSize` | `number` | No | Export file size in bytes. |
| `recordCount` | `integer` | No | The number of records included in the export. |
| `duration` | `number` | No | Time to generate export in milliseconds. |

### 35.3 `privacy.data_deletion_requested`

Fired when a user requests deletion of their personal data.

**When to fire:** When a user submits a right-to-erasure or data deletion request.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | `string` | Yes | Unique identifier for the data deletion request. |
| `userId` | `string` | No | Unique identifier for the user requesting the deletion. |
| `scope` | `string` | No | The scope of the data deletion request: `"full"`, `"partial"`. |
| `dataTypes` | `string[]` | No | List of data types to be deleted. |
| `regulation` | `string` | No | The privacy regulation under which the deletion was requested: `"gdpr"`, `"ccpa"`, `"lgpd"`, `"other"`. |
| `scheduledAt` | `string` | No | The scheduled date and time for the deletion to be executed. |

### 35.4 `privacy.data_deletion_completed`

Fired when a data deletion request has been fully executed.

**When to fire:** When all data covered by the deletion request has been permanently removed.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | `string` | Yes | Unique identifier for the data deletion request. |
| `userId` | `string` | No | Unique identifier for the user whose data was deleted. |
| `scope` | `string` | No | The scope of the data deletion that was performed: `"full"`, `"partial"`. |
| `recordsDeleted` | `integer` | No | The number of records that were deleted. |
| `duration` | `number` | No | Time to complete deletion in milliseconds. |

### 35.5 `privacy.consent_record_created`

Fired when a new consent record is created for a user.

**When to fire:** When a formal consent record is logged for compliance purposes, capturing the user's consent choices.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `consentId` | `string` | Yes | Unique identifier for the consent record. |
| `userId` | `string` | No | Unique identifier for the user associated with the consent record. |
| `purposes` | `object` | No | Map of purpose names to consent status. |
| `regulation` | `string` | No | The privacy regulation under which the consent was recorded: `"gdpr"`, `"ccpa"`, `"lgpd"`, `"other"`. |
| `source` | `string` | No | The source through which the consent was collected: `"banner"`, `"preference_center"`, `"api"`, `"registration"`, `"checkout"`. |
| `ipAddress` | `string` | No | The IP address of the user at the time of consent. |
| `userAgent` | `string` | No | The user agent string of the browser or client at the time of consent. |

---

## 36. Feature Events

Feature events track product feature usage, adoption, activation, and limits. These events support product analytics, feature gating, and usage-based billing.

### 36.1 `feature.used`

Fired when a user uses a product feature.

**When to fire:** When a user actively engages with a specific product feature or capability.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `featureName` | `string` | Yes | Human-readable name of the feature. |
| `featureId` | `string` | No | Unique identifier for the feature. |
| `module` | `string` | No | The product module or area the feature belongs to. |
| `action` | `string` | No | The specific action performed within the feature. |
| `usageCount` | `integer` | No | Cumulative usage count for this feature. |
| `metadata` | `object` | No | Additional key-value pairs providing context about the feature usage. |

### 36.2 `feature.activated`

Fired when a feature is activated for a user or account.

**When to fire:** When a feature is turned on or made available, such as through an upgrade, admin action, or self-service toggle.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `featureName` | `string` | Yes | Human-readable name of the feature. |
| `featureId` | `string` | No | Unique identifier for the feature. |
| `method` | `string` | No | The method by which the feature was activated: `"self_service"`, `"admin"`, `"api"`, `"upgrade"`, `"trial"`. |
| `plan` | `string` | No | The subscription plan associated with the feature activation. |

### 36.3 `feature.deactivated`

Fired when a feature is deactivated for a user or account.

**When to fire:** When a feature is turned off or access is revoked.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `featureName` | `string` | Yes | Human-readable name of the feature. |
| `featureId` | `string` | No | Unique identifier for the feature. |
| `reason` | `string` | No | The reason the feature was deactivated: `"downgrade"`, `"manual"`, `"expired"`, `"limit_reached"`, `"admin"`. |
| `plan` | `string` | No | The subscription plan associated with the feature deactivation. |

### 36.4 `feature.trial_started`

Fired when a user begins a trial period for a feature.

**When to fire:** When a time-limited trial of a premium feature is activated.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `featureName` | `string` | Yes | Human-readable name of the feature being trialed. |
| `featureId` | `string` | No | Unique identifier for the feature. |
| `trialDays` | `integer` | No | The number of days in the trial period. |
| `trialEnd` | `string` | No | The date and time when the trial period ends. |
| `plan` | `string` | No | The subscription plan associated with the feature trial. |

### 36.5 `feature.limit_reached`

Fired when a user reaches the usage limit for a feature.

**When to fire:** When usage of a feature hits its configured maximum threshold.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `featureName` | `string` | Yes | Human-readable name of the feature whose limit was reached. |
| `featureId` | `string` | No | Unique identifier for the feature. |
| `limitType` | `string` | No | The type of limit that was reached: `"usage"`, `"storage"`, `"seats"`, `"api_calls"`, `"bandwidth"`, `"other"`. |
| `currentUsage` | `number` | No | The current usage value at the time the limit was reached. |
| `limit` | `number` | No | The maximum allowed value for the limit. |
| `unit` | `string` | No | The unit of measurement for the usage and limit values. |
| `percentUsed` | `number` | No | The percentage of the limit that has been consumed. |

---

## 37. Loyalty Events

Loyalty events track loyalty program participation, points earning and redemption, tier changes, and reward claims. These events support loyalty program analytics and member engagement tracking.

### 37.1 `loyalty.program_joined`

Fired when a user joins a loyalty program.

**When to fire:** When a user enrolls in a loyalty program, whether through signup, purchase, referral, or automatic enrollment.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `programId` | `string` | Yes | The unique identifier of the loyalty program. |
| `programName` | `string` | No | The name of the loyalty program. |
| `tier` | `string` | No | The initial tier assigned to the member. |
| `memberId` | `string` | No | The unique identifier of the loyalty member. |
| `joinMethod` | `string` | No | The method by which the user joined the program: `"signup"`, `"purchase"`, `"referral"`, `"promotion"`, `"auto"`. |

### 37.2 `loyalty.points_earned`

Fired when a user earns loyalty points.

**When to fire:** When points are credited to a member's account for any qualifying action.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `points` | `integer` | Yes | The number of points earned. |
| `programId` | `string` | No | The unique identifier of the loyalty program. |
| `reason` | `string` | No | The reason the points were earned: `"purchase"`, `"referral"`, `"review"`, `"engagement"`, `"promotion"`, `"birthday"`, `"signup"`, `"other"`. |
| `orderId` | `string` | No | The unique identifier of the associated order. |
| `balance` | `integer` | No | Total points balance after earning. |

### 37.3 `loyalty.points_redeemed`

Fired when a user redeems loyalty points.

**When to fire:** When a member spends points to obtain a reward, discount, or other benefit.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `points` | `integer` | Yes | The number of points redeemed. |
| `programId` | `string` | No | The unique identifier of the loyalty program. |
| `rewardType` | `string` | No | The type of reward redeemed: `"discount"`, `"product"`, `"gift_card"`, `"experience"`, `"shipping"`, `"other"`. |
| `rewardName` | `string` | No | The name of the reward redeemed. |
| `rewardValue` | `number` | No | The monetary value of the reward. |
| `orderId` | `string` | No | The unique identifier of the associated order. |
| `balance` | `integer` | No | Total points balance after redemption. |

### 37.4 `loyalty.tier_upgraded`

Fired when a user is upgraded to a higher loyalty tier.

**When to fire:** When a member's activity or spend qualifies them for a higher tier level.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `programId` | `string` | Yes | The unique identifier of the loyalty program. |
| `previousTier` | `string` | Yes | The tier the user was in before the upgrade. |
| `newTier` | `string` | Yes | The tier the user was upgraded to. |
| `memberId` | `string` | No | The unique identifier of the loyalty member. |
| `qualifyingPoints` | `integer` | No | The number of qualifying points that triggered the upgrade. |
| `qualifyingSpend` | `number` | No | The qualifying spend amount that triggered the upgrade. |

### 37.5 `loyalty.tier_downgraded`

Fired when a user is downgraded to a lower loyalty tier.

**When to fire:** When a member's activity falls below the threshold required to maintain their current tier.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `programId` | `string` | Yes | The unique identifier of the loyalty program. |
| `previousTier` | `string` | Yes | The tier the user was in before the downgrade. |
| `newTier` | `string` | Yes | The tier the user was downgraded to. |
| `memberId` | `string` | No | The unique identifier of the loyalty member. |
| `reason` | `string` | No | The reason for the tier downgrade: `"insufficient_activity"`, `"expiration"`, `"manual"`, `"other"`. |

### 37.6 `loyalty.reward_claimed`

Fired when a user claims a loyalty reward.

**When to fire:** When a member redeems a specific reward from the loyalty catalog.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `rewardId` | `string` | Yes | The unique identifier of the reward. |
| `programId` | `string` | No | The unique identifier of the loyalty program. |
| `rewardName` | `string` | No | The name of the reward claimed. |
| `rewardType` | `string` | No | The type of reward claimed: `"discount"`, `"product"`, `"gift_card"`, `"experience"`, `"shipping"`, `"other"`. |
| `rewardValue` | `number` | No | The monetary value of the reward. |
| `pointsCost` | `integer` | No | The number of points required to claim the reward. |

### 37.7 `loyalty.points_expired`

Fired when loyalty points expire.

**When to fire:** When loyalty points reach their expiration date and are removed from the member's balance.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `programId` | `string` | Yes | The unique identifier of the loyalty program. |
| `memberId` | `string` | No | The unique identifier of the loyalty member. |
| `points` | `integer` | Yes | The number of points that expired. |
| `expiredAt` | `string` | No | ISO 8601 datetime when the points expired. |
| `reason` | `string` | No | The reason for expiration: `"time_limit"`, `"inactivity"`, `"program_change"`, `"other"`. |

---

## 38. Survey Events

Survey events track survey participation, completion, abandonment, individual question responses, and NPS submissions. These events support survey analytics and customer feedback tracking.

### 38.1 `survey.started`

Fired when a user starts a survey.

**When to fire:** When the first question of a survey is displayed to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `surveyId` | `string` | Yes | The unique identifier of the survey. |
| `surveyName` | `string` | No | The name of the survey. |
| `surveyType` | `string` | No | The type of survey: `"nps"`, `"csat"`, `"ces"`, `"feedback"`, `"poll"`, `"research"`, `"other"`. |
| `totalQuestions` | `integer` | No | The total number of questions in the survey. |
| `trigger` | `string` | No | The trigger that initiated the survey: `"in_app"`, `"email"`, `"post_purchase"`, `"post_support"`, `"scheduled"`, `"manual"`. |

### 38.2 `survey.completed`

Fired when a user completes a survey.

**When to fire:** When the user submits or finishes answering all questions in the survey.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `surveyId` | `string` | Yes | The unique identifier of the survey. |
| `surveyName` | `string` | No | The name of the survey. |
| `surveyType` | `string` | No | The type of survey: `"nps"`, `"csat"`, `"ces"`, `"feedback"`, `"poll"`, `"research"`, `"other"`. |
| `duration` | `number` | No | Time to complete the survey in seconds. |
| `questionsAnswered` | `integer` | No | The number of questions answered. |
| `totalQuestions` | `integer` | No | The total number of questions in the survey. |

### 38.3 `survey.abandoned`

Fired when a user abandons a survey before completing it.

**When to fire:** When the user closes or navigates away from a survey without finishing.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `surveyId` | `string` | Yes | The unique identifier of the survey. |
| `surveyName` | `string` | No | The name of the survey. |
| `lastQuestionIndex` | `integer` | No | The index of the last question viewed before abandoning. |
| `questionsAnswered` | `integer` | No | The number of questions answered before abandoning. |
| `totalQuestions` | `integer` | No | The total number of questions in the survey. |
| `duration` | `number` | No | Time spent before abandoning in seconds. |

### 38.4 `survey.question_answered`

Fired when a user answers a question in a survey.

**When to fire:** When the user submits an answer for an individual survey question.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `surveyId` | `string` | Yes | The unique identifier of the survey. |
| `questionIndex` | `integer` | Yes | The index of the question answered. |
| `questionId` | `string` | No | The unique identifier of the question. |
| `questionType` | `string` | No | The type of question answered: `"multiple_choice"`, `"single_choice"`, `"text"`, `"rating"`, `"scale"`, `"matrix"`, `"ranking"`, `"other"`. |
| `questionText` | `string` | No | The text of the question. |
| `answerValue` | `string` | No | The answer value or selected option. |
| `answerNumeric` | `number` | No | Numeric answer value for rating or scale questions. |

### 38.5 `survey.nps_submitted`

Fired when a user submits an NPS (Net Promoter Score) response.

**When to fire:** When the user submits their NPS score (0-10) and optional comment.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `surveyId` | `string` | Yes | The unique identifier of the survey. |
| `score` | `integer` | Yes | NPS score from 0 to 10. |
| `comment` | `string` | No | The optional comment provided with the NPS score. |
| `category` | `string` | No | The NPS category based on the score: `"promoter"`, `"passive"`, `"detractor"`. |
| `touchpoint` | `string` | No | The touchpoint associated with the NPS survey: `"product"`, `"support"`, `"onboarding"`, `"checkout"`, `"general"`, `"other"`. |

---

## 39. Collaboration Events

Collaboration events track workspace creation, team membership changes, role modifications, and content sharing and commenting within collaborative environments.

### 39.1 `collaboration.workspace_created`

Fired when a new workspace is created.

**When to fire:** When a user creates a new collaborative workspace, project space, or team area.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | Yes | The unique identifier of the workspace. |
| `workspaceName` | `string` | No | The human-readable name of the workspace. |
| `workspaceType` | `string` | No | The type of workspace created: `"team"`, `"project"`, `"department"`, `"personal"`, `"other"`. |
| `createdBy` | `string` | No | The unique identifier of the user who created the workspace. |

### 39.2 `collaboration.member_invited`

Fired when a member is invited to a workspace.

**When to fire:** When an invitation is sent to a user to join a workspace.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | Yes | The unique identifier of the workspace the member is invited to. |
| `inviteeId` | `string` | No | The unique identifier of the invited user. |
| `role` | `string` | No | The role assigned to the invited member: `"owner"`, `"admin"`, `"editor"`, `"viewer"`, `"commenter"`, `"guest"`. |
| `inviteMethod` | `string` | No | The method used to send the invitation: `"email"`, `"link"`, `"sso"`, `"api"`. |

### 39.3 `collaboration.member_joined`

Fired when a member joins a workspace.

**When to fire:** When a user accepts an invitation or otherwise gains access to a workspace.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | Yes | The unique identifier of the workspace the member joined. |
| `memberId` | `string` | No | The unique identifier of the member who joined. |
| `role` | `string` | No | The role assigned to the member upon joining: `"owner"`, `"admin"`, `"editor"`, `"viewer"`, `"commenter"`, `"guest"`. |
| `joinMethod` | `string` | No | The method used by the member to join the workspace: `"invite"`, `"link"`, `"sso"`, `"auto"`. |

### 39.4 `collaboration.member_removed`

Fired when a member is removed from a workspace.

**When to fire:** When a member's access to a workspace is revoked or they are removed from the workspace.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | Yes | The unique identifier of the workspace the member was removed from. |
| `memberId` | `string` | No | The unique identifier of the removed member. |
| `role` | `string` | No | The role the member held before removal: `"owner"`, `"admin"`, `"editor"`, `"viewer"`, `"commenter"`, `"guest"`. |
| `removedBy` | `string` | No | The actor that initiated the removal: `"admin"`, `"self"`, `"system"`. |
| `reason` | `string` | No | The reason for the member's removal: `"offboarding"`, `"access_review"`, `"request"`, `"inactivity"`, `"other"`. |

### 39.5 `collaboration.role_changed`

Fired when a member's role is changed within a workspace.

**When to fire:** When a member's permissions or role level is modified.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | Yes | The unique identifier of the workspace where the role change occurred. |
| `previousRole` | `string` | Yes | The role the member held before the change. |
| `newRole` | `string` | Yes | The role assigned to the member after the change. |
| `memberId` | `string` | No | The unique identifier of the member whose role was changed. |
| `changedBy` | `string` | No | The unique identifier of the user who initiated the role change. |

### 39.6 `collaboration.item_shared`

Fired when an item is shared with others.

**When to fire:** When a document, file, folder, or other workspace item is shared with one or more recipients.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | `string` | Yes | The unique identifier of the shared item. |
| `itemType` | `string` | No | The type of item being shared: `"document"`, `"file"`, `"folder"`, `"project"`, `"board"`, `"page"`, `"other"`. |
| `workspaceId` | `string` | No | The unique identifier of the workspace the item belongs to. |
| `shareType` | `string` | No | The type of sharing applied to the item: `"internal"`, `"external"`, `"public"`, `"link"`. |
| `recipientCount` | `integer` | No | The number of recipients the item was shared with. |

### 39.7 `collaboration.item_commented`

Fired when a comment is added to an item.

**When to fire:** When a user posts a comment or reply on a workspace item.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | `string` | Yes | The unique identifier of the item being commented on. |
| `commentId` | `string` | No | The unique identifier of the newly created comment. |
| `itemType` | `string` | No | The type of item being commented on: `"document"`, `"file"`, `"folder"`, `"project"`, `"board"`, `"page"`, `"other"`. |
| `workspaceId` | `string` | No | The unique identifier of the workspace the item belongs to. |
| `isReply` | `boolean` | No | Whether this comment is a reply to another comment. |
| `parentCommentId` | `string` | No | The unique identifier of the parent comment if this is a reply. |

### 39.8 `collaboration.task_created`

Fired when a task is created within a workspace or project.

**When to fire:** When a user creates a new task or to-do item in a collaborative workspace.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `taskId` | `string` | Yes | Unique identifier for the task. |
| `workspaceId` | `string` | No | The unique identifier of the workspace. |
| `projectId` | `string` | No | The unique identifier of the project. |
| `title` | `string` | No | The title of the task. |
| `assigneeId` | `string` | No | The unique identifier of the assigned user. |
| `priority` | `string` | No | The priority of the task: `"critical"`, `"high"`, `"medium"`, `"low"`, `"none"`. |
| `dueDate` | `string` | No | ISO 8601 date or datetime for the task due date. |
| `labels` | `string[]` | No | Labels or tags applied to the task. |

### 39.9 `collaboration.task_completed`

Fired when a task is marked as completed.

**When to fire:** When a user marks a task as done or completed in a collaborative workspace.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `taskId` | `string` | Yes | Unique identifier for the task. |
| `workspaceId` | `string` | No | The unique identifier of the workspace. |
| `projectId` | `string` | No | The unique identifier of the project. |
| `completedBy` | `string` | No | The unique identifier of the user who completed the task. |
| `duration` | `number` | No | Time from task creation to completion in milliseconds. |
| `wasOverdue` | `boolean` | No | Whether the task was completed after its due date. |

---

## 40. Video Call Events

Video call events track video conferencing lifecycle, including call start, participant join/leave, call end, recording, and screen sharing. These events support meeting analytics and engagement tracking.

### 40.1 `video_call.started`

Fired when a video call is started.

**When to fire:** When the host or system initiates a new video call session.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `callType` | `string` | No | The type of video call: `"one_on_one"`, `"group"`, `"webinar"`, `"broadcast"`. |
| `provider` | `string` | No | The video call platform or provider: `"zoom"`, `"teams"`, `"meet"`, `"webex"`, `"custom"`, `"other"`. |
| `scheduledStart` | `string` | No | The originally scheduled start time of the call. |
| `hostId` | `string` | No | The unique identifier of the call host. |
| `isScheduled` | `boolean` | No | Whether the call was scheduled in advance. |

### 40.2 `video_call.joined`

Fired when a participant joins a video call.

**When to fire:** When a user successfully connects to an active video call.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `participantId` | `string` | No | The unique identifier of the participant who joined. |
| `joinMethod` | `string` | No | The method used by the participant to join the call: `"link"`, `"app"`, `"phone"`, `"browser"`, `"dial_in"`. |
| `isHost` | `boolean` | No | Whether the participant is the host of the call. |
| `participantCount` | `integer` | No | The number of participants in the call after joining. |

### 40.3 `video_call.left`

Fired when a participant leaves a video call.

**When to fire:** When a participant disconnects from or is removed from a video call.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `participantId` | `string` | No | The unique identifier of the participant who left. |
| `duration` | `number` | No | Time in the call in seconds. |
| `leaveReason` | `string` | No | The reason the participant left the call: `"ended"`, `"hangup"`, `"dropped"`, `"kicked"`, `"timeout"`. |

### 40.4 `video_call.ended`

Fired when a video call ends.

**When to fire:** When the call session is terminated, either by the host or when all participants leave.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `duration` | `number` | No | Total call duration in seconds. |
| `participantCount` | `integer` | No | The total number of participants who joined the call. |
| `maxParticipants` | `integer` | No | The maximum number of concurrent participants during the call. |
| `hostId` | `string` | No | The unique identifier of the call host. |

### 40.5 `video_call.recording_started`

Fired when a recording is started during a video call.

**When to fire:** When a participant initiates recording of the call.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `recordingId` | `string` | No | The unique identifier of the recording. |
| `initiatedBy` | `string` | No | The unique identifier of the user who initiated the recording. |
| `recordingType` | `string` | No | The type of recording being captured: `"cloud"`, `"local"`, `"transcript"`. |

### 40.6 `video_call.screen_shared`

Fired when a participant shares their screen during a video call.

**When to fire:** When a participant begins sharing their screen, window, tab, or application.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `participantId` | `string` | No | The unique identifier of the participant sharing their screen. |
| `shareType` | `string` | No | The type of screen sharing being used: `"screen"`, `"window"`, `"tab"`, `"application"`. |
| `duration` | `number` | No | Duration of screen share in seconds. |

### 40.7 `video_call.recording_stopped`

Fired when a video call recording is stopped.

**When to fire:** When the recording of a video call is stopped, either manually or automatically.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `callId` | `string` | Yes | The unique identifier of the video call. |
| `recordingId` | `string` | Yes | The unique identifier of the recording. |
| `duration` | `number` | No | Duration of the recording in seconds. |
| `stoppedBy` | `string` | No | Who stopped the recording: `"host"`, `"system"`, `"participant"`. |
| `fileSize` | `number` | No | File size of the recording in bytes. |

---

## 41. Booking Events

Booking events track the reservation lifecycle, from search through booking creation, confirmation, modification, cancellation, check-in, and check-out. These events support booking analytics for hotels, flights, restaurants, and other reservation-based services.

### 41.1 `booking.search_initiated`

Fired when a user initiates a booking search.

**When to fire:** When a user performs a search for available bookings, rooms, flights, or other reservable items.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `bookingType` | `string` | No | The type of booking being searched for: `"hotel"`, `"flight"`, `"restaurant"`, `"rental_car"`, `"activity"`, `"event"`, `"other"`. |
| `destination` | `string` | No | The destination or location being searched. |
| `checkIn` | `string` | No | The desired check-in date or start date. |
| `checkOut` | `string` | No | The desired check-out date or end date. |
| `guests` | `integer` | No | The number of guests. |
| `rooms` | `integer` | No | The number of rooms requested. |
| `resultCount` | `integer` | No | The total number of results returned for the search. |

### 41.2 `booking.reservation_created`

Fired when a new reservation is created.

**When to fire:** When a user completes the initial booking process and a reservation record is created.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `bookingType` | `string` | No | The type of booking: `"hotel"`, `"flight"`, `"restaurant"`, `"rental_car"`, `"activity"`, `"event"`, `"other"`. |
| `propertyName` | `string` | No | Name of the property or venue being booked. |
| `checkIn` | `string` | No | The check-in date or start date. |
| `checkOut` | `string` | No | The check-out date or end date. |
| `guests` | `integer` | No | The number of guests. |
| `rooms` | `integer` | No | The number of rooms booked. |
| `total` | `number` | No | Total cost of the reservation. |
| `currency` | `string` | No | Currency code for the total amount. |

### 41.3 `booking.reservation_confirmed`

Fired when a reservation is confirmed.

**When to fire:** When the booking provider confirms the reservation and issues a confirmation code.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `confirmationCode` | `string` | No | Confirmation code for the reservation. |
| `bookingType` | `string` | No | The type of booking: `"hotel"`, `"flight"`, `"restaurant"`, `"rental_car"`, `"activity"`, `"event"`, `"other"`. |
| `total` | `number` | No | Total cost of the reservation. |
| `currency` | `string` | No | Currency code for the total amount. |

### 41.4 `booking.reservation_modified`

Fired when an existing reservation is modified.

**When to fire:** When a user changes dates, guest count, room type, or other reservation details.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `modifiedFields` | `string[]` | No | List of fields that were modified. |
| `bookingType` | `string` | No | The type of booking: `"hotel"`, `"flight"`, `"restaurant"`, `"rental_car"`, `"activity"`, `"event"`, `"other"`. |
| `priceDifference` | `number` | No | Price change from modification, positive for increase. |

### 41.5 `booking.reservation_cancelled`

Fired when a reservation is cancelled.

**When to fire:** When a reservation is cancelled by the customer, provider, or system.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `reason` | `string` | No | The reason for cancellation: `"plans_changed"`, `"found_better"`, `"price"`, `"weather"`, `"illness"`, `"work"`, `"other"`. |
| `cancellationFee` | `number` | No | Fee charged for the cancellation. |
| `refundAmount` | `number` | No | Amount refunded to the customer. |
| `currency` | `string` | No | Currency code for monetary amounts. |
| `cancelledBy` | `string` | No | The party that initiated the cancellation: `"customer"`, `"provider"`, `"system"`. |

### 41.6 `booking.check_in`

Fired when a guest checks in to a reservation.

**When to fire:** When a guest completes the check-in process for their reservation.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `checkInMethod` | `string` | No | The method used to check in: `"online"`, `"kiosk"`, `"front_desk"`, `"app"`, `"auto"`. |
| `earlyCheckIn` | `boolean` | No | Whether the guest checked in before the standard check-in time. |
| `confirmationCode` | `string` | No | Confirmation code for the reservation. |

### 41.7 `booking.check_out`

Fired when a guest checks out of a reservation.

**When to fire:** When a guest completes the check-out process at the end of their stay.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reservationId` | `string` | Yes | Unique identifier for the reservation. |
| `checkOutMethod` | `string` | No | The method used to check out: `"online"`, `"kiosk"`, `"front_desk"`, `"app"`, `"express"`. |
| `lateCheckOut` | `boolean` | No | Whether the guest checked out after the standard check-out time. |
| `finalTotal` | `number` | No | The final total amount for the stay. |
| `currency` | `string` | No | Currency code for the total amount. |
| `stayDuration` | `number` | No | Duration of stay in nights. |

---

## 42. File Events

File events track file uploads, deletions, previews, format conversions, and versioning. These events support file management analytics and storage monitoring.

### 42.1 `file.uploaded`

Fired when a file is uploaded.

**When to fire:** When a file upload completes successfully.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `fileType` | `string` | No | Type or extension of the file. |
| `fileSize` | `number` | No | File size in bytes. |
| `mimeType` | `string` | No | MIME type of the file. |
| `source` | `string` | No | The source from which the file was uploaded: `"local"`, `"camera"`, `"cloud"`, `"drag_drop"`, `"api"`, `"other"`. |
| `destinationFolder` | `string` | No | The folder or directory where the file was uploaded to. |

### 42.2 `file.deleted`

Fired when a file is deleted.

**When to fire:** When a file is removed from the system, whether temporarily (trash) or permanently.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `fileType` | `string` | No | Type or extension of the file. |
| `fileSize` | `number` | No | File size in bytes. |
| `deletedBy` | `string` | No | The entity that initiated the deletion: `"user"`, `"system"`, `"admin"`, `"retention_policy"`. |
| `permanent` | `boolean` | No | Whether the deletion is permanent or recoverable. |

### 42.3 `file.previewed`

Fired when a file is previewed.

**When to fire:** When a user views a file preview without downloading or opening it fully.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `fileType` | `string` | No | Type or extension of the file. |
| `previewType` | `string` | No | The type of preview displayed: `"thumbnail"`, `"full"`, `"inline"`, `"modal"`. |
| `duration` | `number` | No | Time spent previewing in seconds. |

### 42.4 `file.converted`

Fired when a file is converted from one format to another.

**When to fire:** When a file format conversion completes successfully.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `sourceFormat` | `string` | No | The original format of the file. |
| `targetFormat` | `string` | No | The format the file was converted to. |
| `fileSize` | `number` | No | Output file size in bytes. |
| `duration` | `number` | No | Conversion time in milliseconds. |

### 42.5 `file.version_created`

Fired when a new version of a file is created.

**When to fire:** When a user saves changes that create a new version of an existing file.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `versionNumber` | `integer` | No | The version number of the new file version. |
| `versionId` | `string` | No | Unique identifier for the new version. |
| `previousVersionId` | `string` | No | Unique identifier for the previous version. |
| `changeDescription` | `string` | No | Description of the changes made in this version. |
| `fileSize` | `number` | No | File size in bytes. |

### 42.6 `file.downloaded`

Fired when a user downloads a file.

**When to fire:** When a user initiates and completes a file download.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `fileId` | `string` | Yes | Unique identifier for the file. |
| `fileName` | `string` | No | Name of the file. |
| `fileType` | `string` | No | The MIME type or extension of the file. |
| `fileSize` | `number` | No | File size in bytes. |
| `source` | `string` | No | The source or location from which the file was downloaded. |
| `downloadMethod` | `string` | No | How the download was initiated: `"direct"`, `"bulk"`, `"api"`, `"share_link"`, `"other"`. |

---

## 43. Integration Events

Integration events track the lifecycle of third-party integrations, including connection, disconnection, and data synchronization. These events support integration health monitoring and sync analytics.

### 43.1 `integration.connected`

Fired when an integration is connected to the platform.

**When to fire:** When a user or system successfully establishes a connection with a third-party service.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `integrationId` | `string` | Yes | Unique identifier for the integration. |
| `integrationName` | `string` | No | Human-readable name of the integration. |
| `provider` | `string` | No | The third-party provider of the integration. |
| `category` | `string` | No | The category of the integration: `"crm"`, `"marketing"`, `"analytics"`, `"payment"`, `"communication"`, `"storage"`, `"productivity"`, `"other"`. |
| `connectedBy` | `string` | No | The method or actor that initiated the connection: `"user"`, `"admin"`, `"api"`, `"oauth"`. |
| `scopes` | `string[]` | No | The permission scopes granted to the integration. |

### 43.2 `integration.disconnected`

Fired when an integration is disconnected from the platform.

**When to fire:** When a connection to a third-party service is terminated.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `integrationId` | `string` | Yes | Unique identifier for the integration. |
| `integrationName` | `string` | No | Human-readable name of the integration. |
| `provider` | `string` | No | The third-party provider of the integration. |
| `reason` | `string` | No | The reason the integration was disconnected: `"user_request"`, `"token_expired"`, `"error"`, `"admin_action"`, `"provider_revoked"`, `"other"`. |
| `disconnectedBy` | `string` | No | The actor that initiated the disconnection: `"user"`, `"admin"`, `"system"`, `"provider"`. |

### 43.3 `integration.sync_started`

Fired when an integration data sync begins.

**When to fire:** When a data synchronization process starts between the platform and a third-party service.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `integrationId` | `string` | Yes | Unique identifier for the integration. |
| `integrationName` | `string` | No | Human-readable name of the integration. |
| `syncType` | `string` | No | The type of sync operation: `"full"`, `"incremental"`, `"manual"`, `"scheduled"`. |
| `direction` | `string` | No | The direction of data flow for the sync: `"inbound"`, `"outbound"`, `"bidirectional"`. |
| `dataType` | `string` | No | The type of data being synced. |

### 43.4 `integration.sync_completed`

Fired when an integration data sync completes successfully.

**When to fire:** When a data synchronization process finishes without critical errors.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `integrationId` | `string` | Yes | Unique identifier for the integration. |
| `integrationName` | `string` | No | Human-readable name of the integration. |
| `syncType` | `string` | No | The type of sync operation: `"full"`, `"incremental"`, `"manual"`, `"scheduled"`. |
| `direction` | `string` | No | The direction of data flow for the sync: `"inbound"`, `"outbound"`, `"bidirectional"`. |
| `recordsProcessed` | `integer` | No | The total number of records processed during the sync. |
| `recordsCreated` | `integer` | No | The number of new records created during the sync. |
| `recordsUpdated` | `integer` | No | The number of existing records updated during the sync. |
| `recordsFailed` | `integer` | No | The number of records that failed to sync. |
| `duration` | `number` | No | Sync duration in milliseconds. |

### 43.5 `integration.sync_failed`

Fired when an integration data sync fails.

**When to fire:** When a data synchronization process encounters an error that prevents completion.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `integrationId` | `string` | Yes | Unique identifier for the integration. |
| `integrationName` | `string` | No | Human-readable name of the integration. |
| `syncType` | `string` | No | The type of sync operation: `"full"`, `"incremental"`, `"manual"`, `"scheduled"`. |
| `errorMessage` | `string` | No | A human-readable message describing the sync failure. |
| `errorCode` | `string` | No | A machine-readable error code for the sync failure. |
| `recordsProcessed` | `integer` | No | The total number of records processed before the failure. |
| `recordsFailed` | `integer` | No | The number of records that failed to sync. |
| `isRetryable` | `boolean` | No | Whether the failed sync can be retried. |

### 43.6 `integration.deployment_started`

Fired when a code deployment is initiated.

**When to fire:** When a deployment pipeline begins executing, whether triggered by a user, CI system, or rollback.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `deploymentId` | `string` | Yes | Unique identifier for the deployment. |
| `environment` | `string` | Yes | Target environment: `"production"`, `"staging"`, `"preview"`, `"development"`, `"test"`. |
| `commitSha` | `string` | No | The commit SHA being deployed. |
| `branch` | `string` | No | The source branch for the deployment. |
| `version` | `string` | No | The version or release tag being deployed. |
| `initiatedBy` | `string` | No | How the deployment was triggered: `"user"`, `"ci"`, `"rollback"`, `"schedule"`. |
| `provider` | `string` | No | Deployment provider (e.g. 'vercel', 'netlify', 'aws', 'heroku'). |
| `projectId` | `string` | No | Identifier of the project being deployed. |

### 43.7 `integration.deployment_completed`

Fired when a code deployment finishes.

**When to fire:** When the deployment pipeline finishes execution, whether it succeeded, failed, or was cancelled.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `deploymentId` | `string` | Yes | Unique identifier for the deployment. |
| `environment` | `string` | Yes | Target environment: `"production"`, `"staging"`, `"preview"`, `"development"`, `"test"`. |
| `status` | `string` | Yes | The deployment outcome: `"success"`, `"failure"`, `"cancelled"`, `"rolled_back"`. |
| `commitSha` | `string` | No | The commit SHA that was deployed. |
| `branch` | `string` | No | The source branch for the deployment. |
| `version` | `string` | No | The version or release tag that was deployed. |
| `durationSeconds` | `number` | No | Build and deployment duration in seconds. |
| `provider` | `string` | No | Deployment provider. |
| `projectId` | `string` | No | Identifier of the project. |
| `url` | `string` | No | The deployed URL. |

---

## 44. Automation Events

Automation events track workflow automation, including workflow triggers, completion, failure, rule creation, and individual action execution. These events support workflow analytics and automation monitoring.

### 44.1 `automation.workflow_triggered`

Fired when an automation workflow is triggered.

**When to fire:** When a workflow execution begins, whether triggered by an event, schedule, manual action, or API call.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workflowId` | `string` | Yes | Unique identifier for the workflow. |
| `workflowName` | `string` | No | Human-readable name of the workflow. |
| `trigger` | `string` | No | The type of trigger that initiated the workflow: `"event"`, `"schedule"`, `"manual"`, `"webhook"`, `"condition"`, `"api"`. |
| `triggeredBy` | `string` | No | The user or system that triggered the workflow. |
| `executionId` | `string` | No | Unique identifier for this specific workflow execution. |

### 44.2 `automation.workflow_completed`

Fired when an automation workflow completes execution.

**When to fire:** When all steps in a workflow have been executed or the workflow reaches its terminal state.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workflowId` | `string` | Yes | Unique identifier for the workflow. |
| `workflowName` | `string` | No | Human-readable name of the workflow. |
| `executionId` | `string` | No | Unique identifier for this specific workflow execution. |
| `duration` | `number` | No | Workflow execution time in milliseconds. |
| `stepsCompleted` | `integer` | No | The number of workflow steps that were completed. |
| `totalSteps` | `integer` | No | The total number of steps in the workflow. |
| `status` | `string` | No | The completion status of the workflow: `"success"`, `"partial"`, `"skipped"`. |

### 44.3 `automation.workflow_failed`

Fired when an automation workflow fails during execution.

**When to fire:** When a workflow encounters an error that prevents it from completing.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workflowId` | `string` | Yes | Unique identifier for the workflow. |
| `workflowName` | `string` | No | Human-readable name of the workflow. |
| `executionId` | `string` | No | Unique identifier for this specific workflow execution. |
| `errorMessage` | `string` | No | A human-readable message describing the workflow failure. |
| `failedStep` | `string` | No | The identifier or name of the step where the workflow failed. |
| `stepsCompleted` | `integer` | No | The number of workflow steps completed before the failure. |
| `totalSteps` | `integer` | No | The total number of steps in the workflow. |
| `isRetryable` | `boolean` | No | Whether the failed workflow execution can be retried. |

### 44.4 `automation.rule_created`

Fired when a new automation rule is created.

**When to fire:** When a user or system creates a new rule for an automation workflow.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ruleId` | `string` | Yes | Unique identifier for the rule. |
| `ruleName` | `string` | No | Human-readable name of the rule. |
| `ruleType` | `string` | No | The type of automation rule: `"trigger"`, `"condition"`, `"action"`, `"filter"`, `"transformation"`. |
| `workflowId` | `string` | No | Unique identifier of the workflow this rule belongs to. |
| `createdBy` | `string` | No | The user or system that created the rule. |

### 44.5 `automation.action_executed`

Fired when an automation action is executed within a workflow.

**When to fire:** When an individual action step runs as part of a workflow execution.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `actionId` | `string` | Yes | Unique identifier for the action. |
| `actionType` | `string` | No | The type of action executed: `"send_email"`, `"send_notification"`, `"update_record"`, `"create_record"`, `"webhook"`, `"delay"`, `"condition"`, `"api_call"`, `"other"`. |
| `workflowId` | `string` | No | Unique identifier of the workflow this action belongs to. |
| `executionId` | `string` | No | Unique identifier for this specific workflow execution. |
| `duration` | `number` | No | Action execution time in milliseconds. |
| `status` | `string` | No | The execution status of the action: `"success"`, `"failed"`, `"skipped"`. |

---

## 45. Ad Events

Ad events track advertising impressions, clicks, conversions, revenue, and ad blocking. These events support ad monetization analytics, campaign performance measurement, and publisher revenue tracking.

### 45.1 `ad.impression`

Fired when an ad is displayed and viewable to the user.

**When to fire:** When an ad unit is rendered and meets the viewability threshold.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `adName` | `string` | No | Human-readable name of the ad. |
| `adType` | `string` | No | The format or type of the ad unit: `"banner"`, `"native"`, `"video"`, `"interstitial"`, `"rewarded"`, `"popup"`, `"other"`. |
| `placement` | `string` | No | The placement location or slot where the ad was displayed. |
| `campaignId` | `string` | No | Unique identifier for the advertising campaign. |
| `creativeId` | `string` | No | Unique identifier for the ad creative. |
| `adSize` | `string` | No | The dimensions of the ad unit (e.g. '300x250', '728x90'). |
| `adNetwork` | `string` | No | The ad network or provider serving the ad. |
| `viewableTime` | `number` | No | Time the ad was viewable in milliseconds. |
| `viewablePercent` | `number` | No | Percentage of ad visible in viewport. |

### 45.2 `ad.clicked`

Fired when a user clicks on an ad.

**When to fire:** When a user interacts with an ad unit by clicking or tapping.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `adName` | `string` | No | Human-readable name of the ad. |
| `adType` | `string` | No | The format or type of the ad unit: `"banner"`, `"native"`, `"video"`, `"interstitial"`, `"rewarded"`, `"popup"`, `"other"`. |
| `placement` | `string` | No | The placement location or slot where the ad was displayed. |
| `campaignId` | `string` | No | Unique identifier for the advertising campaign. |
| `creativeId` | `string` | No | Unique identifier for the ad creative. |
| `destinationUrl` | `string` | No | The URL the user is directed to after clicking the ad. |
| `adNetwork` | `string` | No | The ad network or provider serving the ad. |

### 45.3 `ad.conversion`

Fired when a user completes a desired action attributed to an ad.

**When to fire:** When a conversion event (signup, purchase, lead, etc.) is attributed to an ad interaction.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `conversionType` | `string` | No | The type of conversion action completed: `"signup"`, `"purchase"`, `"lead"`, `"install"`, `"add_to_cart"`, `"other"`. |
| `conversionValue` | `number` | No | The monetary value of the conversion. |
| `currency` | `string` | No | ISO 4217 3-letter currency code for the conversion value (e.g. USD, EUR, GBP). |
| `campaignId` | `string` | No | Unique identifier for the advertising campaign. |
| `creativeId` | `string` | No | Unique identifier for the ad creative. |
| `attributionModel` | `string` | No | The attribution model used to credit the conversion to the ad: `"last_click"`, `"first_click"`, `"linear"`, `"time_decay"`, `"position_based"`, `"other"`. |

### 45.4 `ad.revenue_earned`

Fired when ad revenue is recorded for a served ad impression.

**When to fire:** When revenue data is available for a served ad, typically reported by the ad network.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `revenue` | `number` | No | The revenue amount earned from the ad. |
| `currency` | `string` | No | ISO 4217 3-letter currency code for the revenue (e.g. USD, EUR, GBP). |
| `adType` | `string` | No | The format or type of the ad unit: `"banner"`, `"native"`, `"video"`, `"interstitial"`, `"rewarded"`, `"popup"`, `"other"`. |
| `adNetwork` | `string` | No | The ad network or provider serving the ad. |
| `placement` | `string` | No | The placement location or slot where the ad was displayed. |
| `ecpm` | `number` | No | Effective cost per mille (thousand impressions). |

### 45.5 `ad.blocked`

Fired when an ad is blocked from being displayed.

**When to fire:** When an ad fails to render due to an ad blocker, user preference, policy violation, or other blocking mechanism.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `adId` | `string` | Yes | Unique identifier for the ad. |
| `reason` | `string` | No | The reason the ad was blocked: `"ad_blocker"`, `"user_preference"`, `"policy_violation"`, `"malware"`, `"irrelevant"`, `"reported"`, `"other"`. |
| `adType` | `string` | No | The format or type of the ad unit: `"banner"`, `"native"`, `"video"`, `"interstitial"`, `"rewarded"`, `"popup"`, `"other"`. |
| `adNetwork` | `string` | No | The ad network or provider serving the ad. |
| `blockedBy` | `string` | No | The entity that blocked the ad: `"user"`, `"system"`, `"browser"`, `"extension"`. |

---

## 46. Identity Events

Identity events track identity verification processes, including KYC/KYB flows, document submission, and document approval. These events support compliance tracking and verification funnel analysis.

### 46.1 `identity.verification_started`

Fired when an identity verification process is initiated.

**When to fire:** When a user begins the identity verification flow.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `verificationId` | `string` | Yes | Unique identifier for the verification request. |
| `verificationType` | `string` | No | The type of identity verification being performed: `"kyc"`, `"kyb"`, `"age"`, `"address"`, `"phone"`, `"email"`, `"document"`, `"biometric"`, `"other"`. |
| `provider` | `string` | No | The verification service provider. |
| `userId` | `string` | No | Unique identifier for the user undergoing verification. |
| `tier` | `string` | No | The verification tier or level being requested: `"basic"`, `"standard"`, `"enhanced"`. |

### 46.2 `identity.verification_completed`

Fired when an identity verification process is completed.

**When to fire:** When the verification provider returns a result for the verification request.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `verificationId` | `string` | Yes | Unique identifier for the verification request. |
| `verificationType` | `string` | No | The type of identity verification performed: `"kyc"`, `"kyb"`, `"age"`, `"address"`, `"phone"`, `"email"`, `"document"`, `"biometric"`, `"other"`. |
| `provider` | `string` | No | The verification service provider. |
| `userId` | `string` | No | Unique identifier for the user who underwent verification. |
| `result` | `string` | No | The outcome of the verification process: `"approved"`, `"denied"`, `"pending_review"`, `"inconclusive"`. |
| `duration` | `number` | No | Time to complete verification in seconds. |
| `tier` | `string` | No | The verification tier or level that was completed: `"basic"`, `"standard"`, `"enhanced"`. |

### 46.3 `identity.verification_failed`

Fired when an identity verification process fails.

**When to fire:** When the verification process encounters an error or the submitted information does not meet requirements.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `verificationId` | `string` | Yes | Unique identifier for the verification request. |
| `verificationType` | `string` | No | The type of identity verification that was attempted: `"kyc"`, `"kyb"`, `"age"`, `"address"`, `"phone"`, `"email"`, `"document"`, `"biometric"`, `"other"`. |
| `provider` | `string` | No | The verification service provider. |
| `userId` | `string` | No | Unique identifier for the user whose verification failed. |
| `reason` | `string` | No | The reason the verification failed: `"document_expired"`, `"document_unreadable"`, `"mismatch"`, `"fraud_detected"`, `"unsupported_document"`, `"timeout"`, `"technical_error"`, `"other"`. |
| `canRetry` | `boolean` | No | Whether the user is allowed to retry the verification. |

### 46.4 `identity.document_submitted`

Fired when a user submits a document for identity verification.

**When to fire:** When a user uploads or submits a document as part of the verification process.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `verificationId` | `string` | Yes | Unique identifier for the verification request. |
| `documentType` | `string` | No | The type of document submitted for verification: `"passport"`, `"drivers_license"`, `"national_id"`, `"utility_bill"`, `"bank_statement"`, `"tax_return"`, `"selfie"`, `"other"`. |
| `userId` | `string` | No | Unique identifier for the user who submitted the document. |
| `documentCountry` | `string` | No | The country that issued the submitted document. |

### 46.5 `identity.document_approved`

Fired when a submitted document is approved during identity verification.

**When to fire:** When the verification system or reviewer approves a submitted document.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `verificationId` | `string` | Yes | Unique identifier for the verification request. |
| `documentType` | `string` | No | The type of document that was approved: `"passport"`, `"drivers_license"`, `"national_id"`, `"utility_bill"`, `"bank_statement"`, `"tax_return"`, `"selfie"`, `"other"`. |
| `userId` | `string` | No | Unique identifier for the user whose document was approved. |
| `confidenceScore` | `number` | No | Confidence score of document verification from 0 to 1. |

---

## 47. Document Events

Document events track the document signing and management lifecycle, including creation, signing, sending, viewing, and expiration. These events support document workflow analytics and e-signature tracking.

### 47.1 `document.created`

Fired when a new document is created.

**When to fire:** When a user creates a new document, whether from a template or from scratch.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `documentId` | `string` | Yes | Unique identifier for the document. |
| `documentName` | `string` | No | Human-readable name of the document. |
| `documentType` | `string` | No | The type or category of the document: `"contract"`, `"proposal"`, `"invoice"`, `"agreement"`, `"nda"`, `"sow"`, `"report"`, `"other"`. |
| `templateId` | `string` | No | Unique identifier for the template used to create the document, if any. |
| `createdBy` | `string` | No | Identifier for the user who created the document. |

### 47.2 `document.signed`

Fired when a document is signed by a party.

**When to fire:** When a signer completes their signature on the document.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `documentId` | `string` | Yes | Unique identifier for the document. |
| `documentName` | `string` | No | Human-readable name of the document. |
| `signerId` | `string` | No | Unique identifier for the signer. |
| `signerRole` | `string` | No | The role of the person signing the document: `"sender"`, `"signer"`, `"witness"`, `"approver"`. |
| `signatureMethod` | `string` | No | The method used to sign the document: `"electronic"`, `"digital"`, `"wet_ink"`, `"biometric"`. |
| `signatureOrder` | `integer` | No | The position in the signing order for this signer. |
| `allPartiesSigned` | `boolean` | No | Whether all required parties have signed the document. |

### 47.3 `document.sent`

Fired when a document is sent to one or more recipients.

**When to fire:** When a document is dispatched to recipients for review, signing, or information.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `documentId` | `string` | Yes | Unique identifier for the document. |
| `documentName` | `string` | No | Human-readable name of the document. |
| `recipientCount` | `integer` | No | The number of recipients the document was sent to. |
| `sendMethod` | `string` | No | The method used to send the document: `"email"`, `"link"`, `"api"`, `"in_app"`. |
| `expiresAt` | `string` | No | The expiration date or time for the sent document. |

### 47.4 `document.viewed`

Fired when a document is viewed by a user.

**When to fire:** When a recipient opens and views the document.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `documentId` | `string` | Yes | Unique identifier for the document. |
| `documentName` | `string` | No | Human-readable name of the document. |
| `viewerId` | `string` | No | Unique identifier for the user who viewed the document. |
| `viewDuration` | `number` | No | Time spent viewing in seconds. |
| `pagesViewed` | `integer` | No | The number of pages viewed by the user. |
| `totalPages` | `integer` | No | The total number of pages in the document. |

### 47.5 `document.expired`

Fired when a document reaches its expiration date or is otherwise invalidated.

**When to fire:** When a document's signing deadline passes or the document is revoked.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `documentId` | `string` | Yes | Unique identifier for the document. |
| `documentName` | `string` | No | Human-readable name of the document. |
| `reason` | `string` | No | The reason the document expired: `"time_limit"`, `"unsigned"`, `"revoked"`, `"superseded"`. |
| `originalDeadline` | `string` | No | The original deadline or expiration date for the document. |

---

## 48. Finance Events

Finance events track financial transactions, including transfers, deposits, withdrawals, wallet operations, balance checks, and statement generation. These events support financial analytics, transaction monitoring, and banking product analytics.

### 48.1 `finance.transfer_initiated`

Fired when a financial transfer is initiated.

**When to fire:** When a user or system initiates a money transfer between accounts.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transferId` | `string` | Yes | Unique identifier for the transfer. |
| `amount` | `number` | Yes | The monetary amount of the transfer. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `fromAccountId` | `string` | No | Identifier of the source account. |
| `toAccountId` | `string` | No | Identifier of the destination account. |
| `transferType` | `string` | No | The type of transfer: `"internal"`, `"external"`, `"p2p"`, `"wire"`, `"ach"`, `"instant"`. |
| `provider` | `string` | No | The provider or service facilitating the transfer. |

### 48.2 `finance.transfer_completed`

Fired when a financial transfer is successfully completed.

**When to fire:** When the funds have been successfully moved and the transfer is settled.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transferId` | `string` | Yes | Unique identifier for the transfer. |
| `amount` | `number` | Yes | The monetary amount of the transfer. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `fromAccountId` | `string` | No | Identifier of the source account. |
| `toAccountId` | `string` | No | Identifier of the destination account. |
| `transferType` | `string` | No | The type of transfer: `"internal"`, `"external"`, `"p2p"`, `"wire"`, `"ach"`, `"instant"`. |
| `duration` | `number` | No | Time to complete transfer in seconds. |
| `fee` | `number` | No | The fee charged for the transfer. |

### 48.3 `finance.deposit_made`

Fired when a deposit is made into an account.

**When to fire:** When funds are added to an account through any deposit method.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | `number` | Yes | The monetary amount of the deposit. |
| `accountId` | `string` | No | Identifier of the account receiving the deposit. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `depositMethod` | `string` | No | The method used for the deposit: `"bank_transfer"`, `"card"`, `"cash"`, `"check"`, `"crypto"`, `"other"`. |
| `transactionId` | `string` | No | Unique identifier for the deposit transaction. |

### 48.4 `finance.withdrawal_made`

Fired when a withdrawal is made from an account.

**When to fire:** When funds are removed from an account through any withdrawal method.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | `number` | Yes | The monetary amount of the withdrawal. |
| `accountId` | `string` | No | Identifier of the account from which the withdrawal is made. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `withdrawalMethod` | `string` | No | The method used for the withdrawal: `"bank_transfer"`, `"atm"`, `"cash"`, `"check"`, `"crypto"`, `"other"`. |
| `transactionId` | `string` | No | Unique identifier for the withdrawal transaction. |

### 48.5 `finance.wallet_topped_up`

Fired when a wallet is topped up with funds.

**When to fire:** When money is added to a digital wallet or prepaid balance.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | `number` | Yes | The monetary amount added to the wallet. |
| `walletId` | `string` | No | Unique identifier for the wallet. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `topUpMethod` | `string` | No | The method used to top up the wallet: `"bank_transfer"`, `"card"`, `"cash"`, `"crypto"`, `"reward"`, `"other"`. |
| `balance` | `number` | No | Wallet balance after top-up. |

### 48.6 `finance.balance_checked`

Fired when a user checks their account balance.

**When to fire:** When a user views or requests their current account balance.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `accountId` | `string` | No | Identifier of the account whose balance was checked. |
| `accountType` | `string` | No | The type of account: `"checking"`, `"savings"`, `"wallet"`, `"credit"`, `"investment"`, `"crypto"`, `"other"`. |
| `balance` | `number` | No | Current account balance. |
| `currency` | `string` | No | ISO 4217 currency code. |

### 48.7 `finance.statement_generated`

Fired when an account statement is generated.

**When to fire:** When the system generates a periodic or on-demand account statement.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `statementId` | `string` | Yes | Unique identifier for the statement. |
| `accountId` | `string` | No | Identifier of the account the statement is for. |
| `periodStart` | `string` | No | ISO 8601 date for the start of the statement period. |
| `periodEnd` | `string` | No | ISO 8601 date for the end of the statement period. |
| `format` | `string` | No | The format of the generated statement: `"pdf"`, `"csv"`, `"html"`, `"json"`. |
| `transactionCount` | `integer` | No | Number of transactions included in the statement. |

### 48.8 `finance.trade_executed`

Fired when a financial trade or investment order is executed.

**When to fire:** When a buy or sell order for a financial instrument is filled and settled.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tradeId` | `string` | Yes | Unique identifier for the trade. |
| `instrument` | `string` | Yes | Ticker symbol or asset identifier. |
| `instrumentType` | `string` | No | Type of financial instrument: `"stock"`, `"bond"`, `"etf"`, `"mutual_fund"`, `"option"`, `"future"`, `"crypto"`, `"forex"`, `"commodity"`, `"other"`. |
| `side` | `string` | No | Trade direction: `"buy"`, `"sell"`. |
| `quantity` | `number` | No | Number of units traded. |
| `price` | `number` | No | Price per unit. |
| `total` | `number` | No | Total trade value. |
| `currency` | `string` | No | ISO 4217 3-letter currency code (e.g. USD, EUR, GBP). |
| `orderType` | `string` | No | Type of order: `"market"`, `"limit"`, `"stop"`, `"stop_limit"`, `"trailing_stop"`. |
| `executionVenue` | `string` | No | The exchange or venue where the trade was executed. |
| `accountId` | `string` | No | The trading account identifier. |

---

## 49. AI Events

AI events track interactions with AI assistants, chatbots, language models, and AI-powered features. These events support analytics for AI engagement, quality, and adoption.

### 49.1 `ai.conversation_started`

Fired when a user opens or initiates a conversation with an AI assistant.

**When to fire:** When the AI chat interface is opened or the first message is sent.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | Yes | Unique identifier for the conversation. |
| `assistantId` | `string` | No | Identifier for the AI assistant or bot. |
| `assistantName` | `string` | No | Display name of the assistant. |
| `model` | `string` | No | The AI model used (e.g. "gpt-4", "claude-3"). |
| `provider` | `string` | No | AI provider: `"openai"`, `"anthropic"`, `"google"`, `"meta"`, `"cohere"`, `"mistral"`, `"custom"`, `"other"`. |
| `interface` | `string` | No | Interface type: `"chat"`, `"voice"`, `"embedded"`, `"api"`, `"other"`. |
| `context` | `string` | No | What the user was doing when they started the conversation. |

### 49.2 `ai.message_sent`

Fired when a user sends a message or prompt to the AI.

**When to fire:** When the user submits a message to the AI assistant.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | Yes | The conversation this message belongs to. |
| `messageId` | `string` | Yes | Unique identifier for the message. |
| `role` | `string` | No | Message role: `"user"`, `"system"`. |
| `contentLength` | `integer` | No | Length of the message content in characters. |
| `hasAttachments` | `boolean` | No | Whether the message includes attachments. |
| `attachmentTypes` | `string[]` | No | Types of attachments included. |
| `model` | `string` | No | The AI model targeted. |
| `toolsRequested` | `string[]` | No | Tools or functions requested in the message. |

### 49.3 `ai.response_received`

Fired when the AI generates and returns a response.

**When to fire:** When the AI response is fully received (or streaming completes).

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | Yes | The conversation this response belongs to. |
| `messageId` | `string` | Yes | Unique identifier for the response message. |
| `model` | `string` | No | The AI model that generated the response. |
| `provider` | `string` | No | The AI provider. |
| `latencyMs` | `number` | No | Time to generate the response in milliseconds. |
| `promptTokens` | `integer` | No | Number of input tokens. |
| `completionTokens` | `integer` | No | Number of output tokens. |
| `totalTokens` | `integer` | No | Total tokens used. |
| `finishReason` | `string` | No | Why generation stopped: `"stop"`, `"length"`, `"tool_call"`, `"content_filter"`, `"error"`, `"other"`. |
| `isStreaming` | `boolean` | No | Whether the response was streamed. |
| `toolsUsed` | `string[]` | No | Tools or functions invoked during generation. |
| `contentLength` | `integer` | No | Length of the response content in characters. |

### 49.4 `ai.feedback_given`

Fired when a user provides feedback on an AI response.

**When to fire:** When the user rates, flags, or comments on an AI response.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | Yes | The conversation containing the rated response. |
| `messageId` | `string` | Yes | The response message being rated. |
| `feedbackType` | `string` | Yes | Feedback type: `"positive"`, `"negative"`, `"rating"`, `"correction"`, `"flag"`. |
| `rating` | `number` | No | Numeric rating (0-5). |
| `comment` | `string` | No | Free-text feedback. |
| `reason` | `string` | No | Reason: `"helpful"`, `"accurate"`, `"fast"`, `"unhelpful"`, `"inaccurate"`, `"slow"`, `"harmful"`, `"irrelevant"`, `"other"`. |

### 49.5 `ai.suggestion_accepted`

Fired when a user accepts an AI-generated recommendation or suggestion.

**When to fire:** When the user explicitly accepts, applies, or uses an AI suggestion.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | No | The conversation, if applicable. |
| `suggestionId` | `string` | Yes | Unique identifier for the suggestion. |
| `suggestionType` | `string` | No | Type: `"text"`, `"code"`, `"product"`, `"action"`, `"link"`, `"other"`. |
| `source` | `string` | No | Where shown: `"inline"`, `"sidebar"`, `"modal"`, `"autocomplete"`, `"copilot"`, `"other"`. |
| `acceptMethod` | `string` | No | How accepted: `"click"`, `"keyboard_shortcut"`, `"auto"`, `"other"`. |
| `model` | `string` | No | The AI model that generated the suggestion. |

### 49.6 `ai.suggestion_dismissed`

Fired when a user dismisses an AI-generated recommendation.

**When to fire:** When the user explicitly dismisses, closes, or ignores an AI suggestion.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `conversationId` | `string` | No | The conversation, if applicable. |
| `suggestionId` | `string` | Yes | Unique identifier for the suggestion. |
| `suggestionType` | `string` | No | Type: `"text"`, `"code"`, `"product"`, `"action"`, `"link"`, `"other"`. |
| `source` | `string` | No | Where shown: `"inline"`, `"sidebar"`, `"modal"`, `"autocomplete"`, `"copilot"`, `"other"`. |
| `dismissMethod` | `string` | No | How dismissed: `"click"`, `"keyboard_shortcut"`, `"escape"`, `"ignore"`, `"other"`. |
| `reason` | `string` | No | Reason: `"not_relevant"`, `"incorrect"`, `"too_slow"`, `"already_done"`, `"other"`. |
| `model` | `string` | No | The AI model that generated the suggestion. |

---

## 50. Event Taxonomy Quick Reference

| Event Name | Category | Description |
|---|---|---|
| `page.view` | Page | Page or screen viewed |
| `page.leave` | Page | User leaves the page |
| `page.virtual_view` | Page | Virtual page view (SPA) |
| `ecommerce.product_viewed` | Ecommerce | Product detail page viewed |
| `ecommerce.product_list_viewed` | Ecommerce | Product list viewed |
| `ecommerce.product_clicked` | Ecommerce | Product clicked in a list |
| `ecommerce.product_added` | Ecommerce | Product added to cart |
| `ecommerce.product_removed` | Ecommerce | Product removed from cart |
| `ecommerce.cart_viewed` | Ecommerce | Shopping cart viewed |
| `ecommerce.checkout_started` | Ecommerce | Checkout process initiated |
| `ecommerce.checkout_step_completed` | Ecommerce | Checkout step completed |
| `ecommerce.payment_info_entered` | Ecommerce | Payment information submitted |
| `ecommerce.purchase` | Ecommerce | Transaction completed |
| `ecommerce.refund` | Ecommerce | Refund processed |
| `ecommerce.coupon_applied` | Ecommerce | Coupon applied |
| `ecommerce.coupon_removed` | Ecommerce | Coupon removed |
| `ecommerce.wishlist_product_added` | Ecommerce | Product added to wishlist |
| `ecommerce.wishlist_product_removed` | Ecommerce | Product removed from wishlist |
| `ecommerce.cart_abandoned` | Ecommerce | Shopping cart abandoned |
| `ecommerce.shipping_info_entered` | Ecommerce | Shipping information submitted |
| `ecommerce.promotion_viewed` | Ecommerce | Promotion displayed |
| `ecommerce.promotion_clicked` | Ecommerce | Promotion clicked |
| `media.play` | Media | Playback started/resumed |
| `media.pause` | Media | Playback paused |
| `media.complete` | Media | Playback completed |
| `media.seek` | Media | User seeked to new position |
| `media.buffer_start` | Media | Buffering started |
| `media.buffer_end` | Media | Buffering ended |
| `media.quality_change` | Media | Quality level changed |
| `media.ad_start` | Media | Ad playback started |
| `media.ad_complete` | Media | Ad playback completed |
| `media.ad_skip` | Media | Ad skipped |
| `media.milestone` | Media | Playback milestone reached |
| `consent.given` | Consent | Consent granted |
| `consent.revoked` | Consent | Consent revoked |
| `consent.preferences_updated` | Consent | Consent preferences updated |
| `user.signed_up` | User | New account created |
| `user.signed_in` | User | User authenticated |
| `user.signed_out` | User | User logged out |
| `user.profile_updated` | User | Profile information updated |
| `user.identified` | User | Anonymous user identified |
| `form.viewed` | Form | Form displayed |
| `form.started` | Form | User began form interaction |
| `form.step_completed` | Form | Form step completed |
| `form.submitted` | Form | Form submitted |
| `form.error` | Form | Form error occurred |
| `form.abandoned` | Form | Form abandoned |
| `search.performed` | Search | Search query executed |
| `search.result_clicked` | Search | Search result clicked |
| `search.filter_applied` | Search | Search filter applied |
| `search.autocomplete_selected` | Search | Autocomplete suggestion selected |
| `error.occurred` | Error | Application error |
| `error.boundary_triggered` | Error | Error boundary caught error |
| `performance.page_load` | Performance | Page load timing |
| `performance.web_vital` | Performance | Core Web Vital measured |
| `performance.resource_timing` | Performance | Resource load timing |
| `performance.long_task` | Performance | Long task detected |
| `interaction.element_clicked` | Interaction | Element clicked |
| `interaction.element_visible` | Interaction | Element visible (impression) |
| `interaction.scroll_depth` | Interaction | Scroll depth reached |
| `interaction.file_downloaded` | Interaction | File downloaded |
| `interaction.share` | Interaction | Content shared |
| `interaction.print` | Interaction | Content printed |
| `subscription.created` | Subscription | New subscription created |
| `subscription.trial_started` | Subscription | Trial period started |
| `subscription.trial_ended` | Subscription | Trial period ended |
| `subscription.activated` | Subscription | Subscription activated |
| `subscription.upgraded` | Subscription | Subscription upgraded |
| `subscription.downgraded` | Subscription | Subscription downgraded |
| `subscription.renewed` | Subscription | Subscription renewed |
| `subscription.cancelled` | Subscription | Subscription cancelled |
| `subscription.paused` | Subscription | Subscription paused |
| `subscription.resumed` | Subscription | Subscription resumed |
| `subscription.payment_failed` | Subscription | Subscription payment failed |
| `payment.method_added` | Payment | Payment method added |
| `payment.method_removed` | Payment | Payment method removed |
| `payment.method_updated` | Payment | Payment method updated |
| `payment.invoice_created` | Payment | Invoice created |
| `payment.invoice_paid` | Payment | Invoice paid |
| `payment.invoice_overdue` | Payment | Invoice overdue |
| `payment.payout_initiated` | Payment | Payout initiated |
| `payment.payout_completed` | Payment | Payout completed |
| `payment.payment_failed` | Payment | Payment failed |
| `experiment.exposure` | Experiment | User exposed to experiment |
| `experiment.variant_assigned` | Experiment | Variant assigned to user |
| `experiment.conversion` | Experiment | Experiment conversion |
| `experiment.feature_flag_evaluated` | Experiment | Feature flag evaluated |
| `auth.password_reset_requested` | Auth | Password reset requested |
| `auth.password_reset_completed` | Auth | Password reset completed |
| `auth.mfa_enabled` | Auth | MFA enabled |
| `auth.mfa_disabled` | Auth | MFA disabled |
| `auth.mfa_challenged` | Auth | MFA challenge presented |
| `auth.mfa_completed` | Auth | MFA challenge completed |
| `auth.session_expired` | Auth | Session expired |
| `auth.token_refreshed` | Auth | Token refreshed |
| `auth.login_failed` | Auth | Login attempt failed |
| `onboarding.started` | Onboarding | Onboarding flow started |
| `onboarding.step_completed` | Onboarding | Onboarding step completed |
| `onboarding.step_skipped` | Onboarding | Onboarding step skipped |
| `onboarding.completed` | Onboarding | Onboarding flow completed |
| `onboarding.abandoned` | Onboarding | Onboarding flow abandoned |
| `onboarding.tour_started` | Onboarding | Product tour started |
| `onboarding.tour_completed` | Onboarding | Product tour completed |
| `onboarding.checklist_item_completed` | Onboarding | Checklist item completed |
| `notification.sent` | Notification | Notification sent |
| `notification.delivered` | Notification | Notification delivered |
| `notification.opened` | Notification | Notification opened |
| `notification.clicked` | Notification | Notification clicked |
| `notification.dismissed` | Notification | Notification dismissed |
| `notification.permission_requested` | Notification | Notification permission requested |
| `notification.permission_granted` | Notification | Notification permission granted |
| `notification.permission_denied` | Notification | Notification permission denied |
| `social.follow` | Social | User followed |
| `social.unfollow` | Social | User unfollowed |
| `social.like` | Social | Content liked |
| `social.unlike` | Social | Content unliked |
| `social.comment_posted` | Social | Comment posted |
| `social.comment_deleted` | Social | Comment deleted |
| `social.post_created` | Social | Post created |
| `social.post_deleted` | Social | Post deleted |
| `social.reaction_added` | Social | Reaction added |
| `social.reaction_removed` | Social | Reaction removed |
| `content.viewed` | Content | Content viewed |
| `content.created` | Content | Content created |
| `content.updated` | Content | Content updated |
| `content.deleted` | Content | Content deleted |
| `content.published` | Content | Content published |
| `content.archived` | Content | Content archived |
| `content.rated` | Content | Content rated |
| `content.bookmarked` | Content | Content bookmarked |
| `content.shared` | Content | Content shared |
| `content.drafted` | Content | Content drafted |
| `review.submitted` | Review | Review submitted |
| `review.updated` | Review | Review updated |
| `review.deleted` | Review | Review deleted |
| `review.helpful_marked` | Review | Review marked as helpful |
| `review.reported` | Review | Review reported |
| `referral.link_created` | Referral | Referral link created |
| `referral.link_shared` | Referral | Referral link shared |
| `referral.invite_sent` | Referral | Referral invite sent |
| `referral.invite_accepted` | Referral | Referral invite accepted |
| `referral.reward_earned` | Referral | Referral reward earned |
| `support.ticket_created` | Support | Support ticket created |
| `support.ticket_updated` | Support | Support ticket updated |
| `support.ticket_resolved` | Support | Support ticket resolved |
| `support.chat_started` | Support | Support chat started |
| `support.chat_ended` | Support | Support chat ended |
| `support.feedback_submitted` | Support | Feedback submitted |
| `support.rating_given` | Support | Rating given |
| `support.article_viewed` | Support | Support article viewed |
| `support.article_helpful` | Support | Article helpfulness rated |
| `support.ticket_escalated` | Support | Ticket escalated |
| `communication.message_sent` | Communication | Message sent |
| `communication.message_received` | Communication | Message received |
| `communication.message_read` | Communication | Message read |
| `communication.email_sent` | Communication | Email sent |
| `communication.email_opened` | Communication | Email opened |
| `communication.email_clicked` | Communication | Email link clicked |
| `communication.email_bounced` | Communication | Email bounced |
| `communication.email_unsubscribed` | Communication | Email unsubscribed |
| `scheduling.appointment_booked` | Scheduling | Appointment booked |
| `scheduling.appointment_cancelled` | Scheduling | Appointment cancelled |
| `scheduling.appointment_rescheduled` | Scheduling | Appointment rescheduled |
| `scheduling.appointment_completed` | Scheduling | Appointment completed |
| `scheduling.reminder_sent` | Scheduling | Reminder sent |
| `scheduling.availability_checked` | Scheduling | Availability checked |
| `marketplace.listing_created` | Marketplace | Listing created |
| `marketplace.listing_updated` | Marketplace | Listing updated |
| `marketplace.listing_published` | Marketplace | Listing published |
| `marketplace.listing_removed` | Marketplace | Listing removed |
| `marketplace.offer_made` | Marketplace | Offer made |
| `marketplace.offer_accepted` | Marketplace | Offer accepted |
| `marketplace.offer_rejected` | Marketplace | Offer rejected |
| `marketplace.seller_contacted` | Marketplace | Seller contacted |
| `marketplace.dispute_opened` | Marketplace | Dispute opened |
| `marketplace.dispute_resolved` | Marketplace | Dispute resolved |
| `education.course_enrolled` | Education | Course enrolled |
| `education.course_started` | Education | Course started |
| `education.course_completed` | Education | Course completed |
| `education.lesson_started` | Education | Lesson started |
| `education.lesson_completed` | Education | Lesson completed |
| `education.quiz_started` | Education | Quiz started |
| `education.quiz_completed` | Education | Quiz completed |
| `education.certificate_earned` | Education | Certificate earned |
| `gaming.level_started` | Gaming | Level started |
| `gaming.level_completed` | Gaming | Level completed |
| `gaming.achievement_unlocked` | Gaming | Achievement unlocked |
| `gaming.item_acquired` | Gaming | Item acquired |
| `gaming.item_used` | Gaming | Item used |
| `gaming.score_posted` | Gaming | Score posted |
| `gaming.challenge_started` | Gaming | Challenge started |
| `gaming.challenge_completed` | Gaming | Challenge completed |
| `gaming.currency_earned` | Gaming | Virtual currency earned |
| `gaming.currency_spent` | Gaming | Virtual currency spent |
| `crm.lead_created` | CRM | Lead created |
| `crm.lead_qualified` | CRM | Lead qualified |
| `crm.lead_converted` | CRM | Lead converted |
| `crm.opportunity_created` | CRM | Opportunity created |
| `crm.opportunity_updated` | CRM | Opportunity updated |
| `crm.opportunity_won` | CRM | Opportunity won |
| `crm.opportunity_lost` | CRM | Opportunity lost |
| `crm.demo_requested` | CRM | Demo requested |
| `crm.demo_scheduled` | CRM | Demo scheduled |
| `crm.demo_completed` | CRM | Demo completed |
| `crm.contract_sent` | CRM | Contract sent |
| `crm.contract_signed` | CRM | Contract signed |
| `app.installed` | App | App installed |
| `app.opened` | App | App opened |
| `app.backgrounded` | App | App backgrounded |
| `app.foregrounded` | App | App foregrounded |
| `app.updated` | App | App updated |
| `app.crashed` | App | App crashed |
| `app.deep_link_opened` | App | Deep link opened |
| `app.screen_viewed` | App | Screen viewed |
| `app.device_connected` | App | Physical device connected |
| `app.device_disconnected` | App | Physical device disconnected |
| `app.device_firmware_updated` | App | Device firmware updated |
| `order.confirmed` | Order | Order confirmed |
| `order.processing` | Order | Order processing |
| `order.shipped` | Order | Order shipped |
| `order.delivered` | Order | Order delivered |
| `order.return_requested` | Order | Return requested |
| `order.returned` | Order | Order returned |
| `order.cancelled` | Order | Order cancelled |
| `account.created` | Account | Account created |
| `account.suspended` | Account | Account suspended |
| `account.reactivated` | Account | Account reactivated |
| `account.deleted` | Account | Account deleted |
| `account.settings_updated` | Account | Account settings updated |
| `account.team_member_added` | Account | Team member added |
| `account.seat_added` | Account | Seat provisioned |
| `account.seat_removed` | Account | Seat deprovisioned |
| `privacy.data_export_requested` | Privacy | Data export requested |
| `privacy.data_export_completed` | Privacy | Data export completed |
| `privacy.data_deletion_requested` | Privacy | Data deletion requested |
| `privacy.data_deletion_completed` | Privacy | Data deletion completed |
| `privacy.consent_record_created` | Privacy | Consent record created |
| `feature.used` | Feature | Feature used |
| `feature.activated` | Feature | Feature activated |
| `feature.deactivated` | Feature | Feature deactivated |
| `feature.trial_started` | Feature | Feature trial started |
| `feature.limit_reached` | Feature | Feature limit reached |
| `loyalty.program_joined` | Loyalty | Loyalty program joined |
| `loyalty.points_earned` | Loyalty | Loyalty points earned |
| `loyalty.points_redeemed` | Loyalty | Loyalty points redeemed |
| `loyalty.tier_upgraded` | Loyalty | Loyalty tier upgraded |
| `loyalty.tier_downgraded` | Loyalty | Loyalty tier downgraded |
| `loyalty.reward_claimed` | Loyalty | Loyalty reward claimed |
| `loyalty.points_expired` | Loyalty | Loyalty points expired |
| `survey.started` | Survey | Survey started |
| `survey.completed` | Survey | Survey completed |
| `survey.abandoned` | Survey | Survey abandoned |
| `survey.question_answered` | Survey | Survey question answered |
| `survey.nps_submitted` | Survey | NPS submitted |
| `collaboration.workspace_created` | Collaboration | Workspace created |
| `collaboration.member_invited` | Collaboration | Member invited |
| `collaboration.member_joined` | Collaboration | Member joined |
| `collaboration.member_removed` | Collaboration | Member removed |
| `collaboration.role_changed` | Collaboration | Role changed |
| `collaboration.item_shared` | Collaboration | Item shared |
| `collaboration.item_commented` | Collaboration | Item commented |
| `collaboration.task_created` | Collaboration | Task created |
| `collaboration.task_completed` | Collaboration | Task completed |
| `video_call.started` | Video Call | Call started |
| `video_call.joined` | Video Call | Participant joined |
| `video_call.left` | Video Call | Participant left |
| `video_call.ended` | Video Call | Call ended |
| `video_call.recording_started` | Video Call | Recording started |
| `video_call.screen_shared` | Video Call | Screen shared |
| `video_call.recording_stopped` | Video Call | Recording stopped |
| `booking.search_initiated` | Booking | Booking search initiated |
| `booking.reservation_created` | Booking | Reservation created |
| `booking.reservation_confirmed` | Booking | Reservation confirmed |
| `booking.reservation_modified` | Booking | Reservation modified |
| `booking.reservation_cancelled` | Booking | Reservation cancelled |
| `booking.check_in` | Booking | Guest checked in |
| `booking.check_out` | Booking | Guest checked out |
| `file.uploaded` | File | File uploaded |
| `file.deleted` | File | File deleted |
| `file.previewed` | File | File previewed |
| `file.converted` | File | File converted |
| `file.version_created` | File | File version created |
| `file.downloaded` | File | File downloaded |
| `integration.connected` | Integration | Integration connected |
| `integration.disconnected` | Integration | Integration disconnected |
| `integration.sync_started` | Integration | Sync started |
| `integration.sync_completed` | Integration | Sync completed |
| `integration.sync_failed` | Integration | Sync failed |
| `integration.deployment_started` | Integration | Deployment started |
| `integration.deployment_completed` | Integration | Deployment completed |
| `automation.workflow_triggered` | Automation | Workflow triggered |
| `automation.workflow_completed` | Automation | Workflow completed |
| `automation.workflow_failed` | Automation | Workflow failed |
| `automation.rule_created` | Automation | Rule created |
| `automation.action_executed` | Automation | Action executed |
| `ad.impression` | Ad | Ad impression |
| `ad.clicked` | Ad | Ad clicked |
| `ad.conversion` | Ad | Ad conversion |
| `ad.revenue_earned` | Ad | Ad revenue earned |
| `ad.blocked` | Ad | Ad blocked |
| `identity.verification_started` | Identity | Verification started |
| `identity.verification_completed` | Identity | Verification completed |
| `identity.verification_failed` | Identity | Verification failed |
| `identity.document_submitted` | Identity | Document submitted |
| `identity.document_approved` | Identity | Document approved |
| `document.created` | Document | Document created |
| `document.signed` | Document | Document signed |
| `document.sent` | Document | Document sent |
| `document.viewed` | Document | Document viewed |
| `document.expired` | Document | Document expired |
| `finance.transfer_initiated` | Finance | Transfer initiated |
| `finance.transfer_completed` | Finance | Transfer completed |
| `finance.deposit_made` | Finance | Deposit made |
| `finance.withdrawal_made` | Finance | Withdrawal made |
| `finance.wallet_topped_up` | Finance | Wallet topped up |
| `finance.balance_checked` | Finance | Balance checked |
| `finance.statement_generated` | Finance | Statement generated |
| `finance.trade_executed` | Finance | Trade executed |
| `ai.conversation_started` | AI | AI conversation started |
| `ai.message_sent` | AI | Message sent to AI |
| `ai.response_received` | AI | AI response received |
| `ai.feedback_given` | AI | AI feedback given |
| `ai.suggestion_accepted` | AI | AI suggestion accepted |
| `ai.suggestion_dismissed` | AI | AI suggestion dismissed |
| `custom.*` | Custom | Extension events |
