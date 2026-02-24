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

`page`, `ecommerce`, `media`, `consent`, `user`, `form`, `search`, `error`, `performance`, `interaction`

The `custom` category is reserved for user-defined extension events (see [Section 14](#14-custom-events)).

### 2.4 Wildcard Subscriptions

Consumers MAY subscribe to events using wildcard patterns. The wildcard character `*` matches any action within a category:

- `ecommerce.*` matches all ecommerce events.
- `*.*` matches all events (use with caution).
- `*.view` is NOT a valid wildcard pattern — wildcards are only supported on the action segment.

Wildcard subscriptions are described in detail in [transport.md](transport.md).

## 3. Event Taxonomy Overview

The complete ODL event taxonomy is organized into 11 categories:

| Category | Events | Purpose |
|---|---|---|
| `page` | 3 | Page and screen lifecycle |
| `ecommerce` | 17 | Shopping and transaction tracking |
| `media` | 11 | Audio, video, and streaming media |
| `consent` | 3 | Privacy consent management |
| `user` | 5 | Authentication and identity |
| `form` | 6 | Form interaction lifecycle |
| `search` | 3 | Search behavior |
| `error` | 2 | Error tracking |
| `performance` | 4 | Performance measurement |
| `interaction` | 6 | General UI interactions |
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

### 5.17 `ecommerce.promotion_viewed`

Fired when a promotional banner, widget, or placement is displayed to the user.

**Data payload:**

| Field | Type | Required | Description |
|---|---|---|---|
| `promotionId` | `string` | Yes | Unique identifier for the promotion. |
| `name` | `string` | No | Name of the promotion. |
| `creative` | `string` | No | Creative variant name or ID. |
| `position` | `string` | No | Position or slot where the promotion was displayed. |

### 5.18 `ecommerce.promotion_clicked`

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

## 15. Event Taxonomy Quick Reference

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
| `custom.*` | Custom | Extension events |
