# Event Reference

This page is a quick reference for every standard event in the OpenDataLayer specification. Events follow a `category.action` naming convention using `snake_case`. For full payload schemas and field-level documentation, see the [ODL Specification](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/spec/v1/events.md).

## Event Taxonomy Overview

The ODL event taxonomy spans 11 categories with 60+ standard events:

| Category | Count | Purpose |
|----------|-------|---------|
| [`page`](#page-events) | 3 | Page and screen lifecycle |
| [`ecommerce`](#ecommerce-events) | 17 | Shopping and transaction tracking |
| [`media`](#media-events) | 11 | Audio, video, and streaming media |
| [`consent`](#consent-events) | 3 | Privacy consent management |
| [`user`](#user-events) | 5 | Authentication and identity |
| [`form`](#form-events) | 6 | Form interaction lifecycle |
| [`search`](#search-events) | 3 | Search behavior |
| [`error`](#error-events) | 2 | Error tracking |
| [`performance`](#performance-events) | 4 | Performance measurement |
| [`interaction`](#interaction-events) | 6 | General UI interactions |
| [`custom`](#custom-events) | Unlimited | Extension events |

## Naming Convention

All events follow the format `category.action`:

- Both segments use **snake_case** (lowercase, underscore-separated).
- There is always exactly **one dot** in an event name.
- Wildcard subscriptions are supported: `ecommerce.*` matches all ecommerce events; `*` matches everything.

## Page Events

| Event | Description |
|-------|-------------|
| `page.view` | Page or screen viewed. Fire on every page load and SPA route change. |
| `page.leave` | User navigates away from the page. Includes time-on-page and scroll depth. |
| `page.virtual_view` | Virtual page view in a SPA or modal that represents a logical page. |

### page.view example

```json
{
  "event": "page.view",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-23T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": {
    "page": {
      "url": "https://www.example.com/products/running-shoes",
      "title": "Running Shoes -- Example Store",
      "path": "/products/running-shoes",
      "referrer": "https://www.google.com/",
      "type": "product"
    }
  },
  "data": {
    "title": "Running Shoes -- Example Store",
    "url": "https://www.example.com/products/running-shoes",
    "path": "/products/running-shoes",
    "referrer": "https://www.google.com/",
    "type": "product"
  }
}
```

## Ecommerce Events

Ecommerce events track the complete shopping lifecycle. Many events reference a shared **Product object**:

| Product Field | Type | Required | Description |
|---------------|------|----------|-------------|
| `id` | `string` | Yes | Product SKU or unique identifier |
| `name` | `string` | Yes | Product name |
| `brand` | `string` | No | Product brand |
| `category` | `string` | No | Category path (use `/` for hierarchy) |
| `variant` | `string` | No | Product variant (e.g., `"Blue/Size-10"`) |
| `price` | `number` | No | Unit price |
| `quantity` | `number` | No | Quantity (default: 1) |
| `coupon` | `string` | No | Applied coupon code |
| `position` | `number` | No | Position in a list |
| `url` | `string` | No | Product page URL |
| `imageUrl` | `string` | No | Product image URL |

### Event reference

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `ecommerce.product_viewed` | Product detail page viewed | `product`, `currency` |
| `ecommerce.product_list_viewed` | Product list/category page viewed | `listId`, `products[]`, `currency` |
| `ecommerce.product_clicked` | Product clicked in a list | `product`, `listId` |
| `ecommerce.product_added` | Product added to cart | `product`, `cartId`, `currency` |
| `ecommerce.product_removed` | Product removed from cart | `product`, `cartId`, `currency` |
| `ecommerce.cart_viewed` | Shopping cart viewed | `products[]`, `cartTotal`, `currency` |
| `ecommerce.checkout_started` | Checkout initiated | `products[]`, `revenue`, `currency` |
| `ecommerce.checkout_step_completed` | Checkout step completed | `step`, `stepName` |
| `ecommerce.payment_info_entered` | Payment info submitted | `paymentMethod` |
| `ecommerce.purchase` | Transaction completed | `orderId`, `revenue`, `currency`, `products[]` |
| `ecommerce.refund` | Refund processed | `orderId`, `revenue`, `products[]` |
| `ecommerce.coupon_applied` | Coupon applied | `coupon`, `discount` |
| `ecommerce.coupon_removed` | Coupon removed | `coupon` |
| `ecommerce.wishlist_product_added` | Product added to wishlist | `product`, `wishlistId` |
| `ecommerce.wishlist_product_removed` | Product removed from wishlist | `product`, `wishlistId` |
| `ecommerce.promotion_viewed` | Promotion displayed | `promotionId`, `name`, `creative` |
| `ecommerce.promotion_clicked` | Promotion clicked | `promotionId`, `name`, `creative` |

### ecommerce.purchase example

```json
{
  "event": "ecommerce.purchase",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-23T14:22:00.000Z",
  "specVersion": "1.0.0",
  "data": {
    "orderId": "ORD-20260223-001",
    "affiliation": "Example Store",
    "revenue": 284.97,
    "tax": 24.99,
    "shipping": 5.99,
    "discount": 10.00,
    "currency": "USD",
    "coupon": "SPRING10",
    "products": [
      {
        "id": "SKU-123",
        "name": "Running Shoes",
        "brand": "SpeedRunner",
        "category": "Footwear/Running",
        "variant": "Blue/Size-10",
        "price": 129.99,
        "quantity": 2,
        "coupon": "SHOE5"
      },
      {
        "id": "SKU-456",
        "name": "Running Socks",
        "brand": "SpeedRunner",
        "category": "Accessories/Socks",
        "price": 14.99,
        "quantity": 1
      }
    ]
  }
}
```

## Media Events

Media events track audio, video, and streaming media playback. Most media events share a common set of fields:

| Common Field | Type | Required | Description |
|-------------|------|----------|-------------|
| `mediaId` | `string` | Yes | Unique media asset identifier |
| `title` | `string` | No | Media content title |
| `mediaType` | `string` | No | `"video"`, `"audio"`, or `"livestream"` |
| `duration` | `number` | No | Total duration in seconds |
| `position` | `number` | No | Current playback position in seconds |
| `provider` | `string` | No | Media provider (e.g., `"youtube"`, `"vimeo"`) |

| Event | Description | Additional fields |
|-------|-------------|-------------------|
| `media.play` | Playback started or resumed | `isAutoplay`, `isResume` |
| `media.pause` | Playback paused | -- |
| `media.complete` | Playback finished | -- |
| `media.seek` | User seeked to new position | `seekFrom`, `seekTo` |
| `media.buffer_start` | Buffering started | -- |
| `media.buffer_end` | Buffering ended | `bufferDuration` |
| `media.quality_change` | Quality level changed | `fromQuality`, `toQuality`, `isAutomatic` |
| `media.ad_start` | Ad playback started | `adId`, `adType`, `adDuration` |
| `media.ad_complete` | Ad playback completed | `adId`, `adType` |
| `media.ad_skip` | Ad skipped by user | `adId`, `skipPosition` |
| `media.milestone` | Playback milestone reached | `milestone` (percentage) |

## Consent Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `consent.given` | User granted consent | `categories`, `method`, `source` |
| `consent.revoked` | User revoked consent | `categories`, `method`, `source` |
| `consent.preferences_updated` | User updated preferences | `categories`, `method`, `previousCategories` |

### consent.given example

```json
{
  "event": "consent.given",
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "timestamp": "2026-02-23T10:30:01.000Z",
  "specVersion": "1.0.0",
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

::: tip
Consent events are exempt from the `consent-before-tracking` validation rule -- they may legitimately fire before consent is granted.
:::

## User Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `user.signed_up` | New account created | `userId`, `method`, `provider` |
| `user.signed_in` | User authenticated | `userId`, `method`, `provider` |
| `user.signed_out` | User logged out | `userId` |
| `user.profile_updated` | Profile information changed | `userId`, `updatedFields` |
| `user.identified` | Anonymous user identified | `userId`, `anonymousId`, `traits` |

::: warning
Form field values and PII (email, phone, etc.) MUST NOT appear in `user.profile_updated` event data. Only metadata like `updatedFields: ["email", "phone"]` should be tracked.
:::

## Form Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `form.viewed` | Form displayed to user | `formId`, `formName`, `formType` |
| `form.started` | User began form interaction | `formId`, `firstField` |
| `form.step_completed` | Multi-step form step completed | `formId`, `step`, `stepName`, `totalSteps` |
| `form.submitted` | Form submitted successfully | `formId`, `formName`, `formType` |
| `form.error` | Form submission failed | `formId`, `errorType`, `errorFields` |
| `form.abandoned` | User abandoned form before submitting | `formId`, `lastField`, `fieldsCompleted`, `duration` |

## Search Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `search.performed` | Search query executed | `query`, `resultCount`, `searchType`, `filters` |
| `search.result_clicked` | Search result clicked | `query`, `resultId`, `resultPosition` |
| `search.filter_applied` | Search filter changed | `filterName`, `filterValue`, `resultCount` |

## Error Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `error.occurred` | Application error occurred | `message`, `type`, `stack`, `filename`, `isFatal` |
| `error.boundary_triggered` | UI error boundary caught error | `componentName`, `message`, `fallbackDisplayed` |

## Performance Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `performance.page_load` | Page fully loaded | `domContentLoaded`, `loadComplete`, `firstByte` |
| `performance.web_vital` | Core Web Vital measured | `name` (LCP, INP, CLS, FCP, TTFB), `value`, `rating` |
| `performance.resource_timing` | Resource load timing | `resourceUrl`, `resourceType`, `duration` |
| `performance.long_task` | Long task detected (>50ms) | `duration`, `attribution` |

## Interaction Events

| Event | Description | Key data fields |
|-------|-------------|-----------------|
| `interaction.element_clicked` | UI element clicked | `elementId`, `elementTag`, `elementText`, `region` |
| `interaction.element_visible` | Element entered viewport | `elementId`, `region`, `visiblePercent` |
| `interaction.scroll_depth` | Scroll depth threshold reached | `depth` (percentage), `direction` |
| `interaction.file_downloaded` | File downloaded | `fileUrl`, `fileName`, `fileType`, `fileSize` |
| `interaction.share` | Content shared | `method`, `contentType`, `contentId` |
| `interaction.print` | Page printed | `contentType`, `contentId` |

## Custom Events

The `custom` category is an escape hatch for organization-specific events:

```ts
odl.track('custom.quiz_completed', {
  quizId: 'quiz-101',
  score: 85,
  totalQuestions: 20,
  correctAnswers: 17,
});

odl.track('custom.chatbot_opened', {
  triggeredBy: 'help-button',
  page: '/checkout',
});
```

Custom events follow the same `category.action` format: `custom.action_name` in `snake_case`. You can define JSON Schemas for custom events to get validation support -- see the [Validation guide](/guide/validation#custom-schemas).

## Complete Quick Reference

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

For the full specification with complete field-level documentation, see the [Events Specification](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/spec/v1/events.md).
