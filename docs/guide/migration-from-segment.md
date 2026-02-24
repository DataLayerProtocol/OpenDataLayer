---
title: Migrating from Segment
description: Step-by-step guide to migrating from Segment analytics.js to OpenDataLayer
---

# Migrating from Segment

If you're using Segment's `analytics.js`, your codebase already has structured event tracking. This guide shows how to adopt OpenDataLayer incrementally -- you can keep Segment as a destination while gaining type safety, schema validation, and direct adapters to other vendors.

## Why Migrate

| Problem | Segment | OpenDataLayer |
|---------|---------|---------------|
| **Cost** | Per-event pricing that scales with volume. Enterprise plans required for advanced features. | Open source, zero per-event cost. You control your data pipeline. |
| **Vendor lock-in** | Segment is the single router. If you leave, you re-instrument everything. | Vendor-neutral. Segment becomes one adapter among many. |
| **Type safety** | No TypeScript types for events. Tracking plans are separate from code. | Full TypeScript types. Schema is code. |
| **Validation** | Protocols requires an enterprise plan. Violations are reported after the fact. | Local validation in dev and CI. Catch issues before they hit production. |
| **Flexibility** | Event schema must match Segment's spec. Custom properties are untyped. | Extensible schema with custom dimensions and context objects. |

## Side-by-Side Comparison

### Page View

::: code-group

```js [Segment (before)]
analytics.page('Home', {
  path: '/home',
  url: 'https://example.com/home',
  title: 'Home Page',
  referrer: 'https://google.com',
});
```

```ts [ODL (after)]
odl.track('page.view', {
  path: '/home',
  url: 'https://example.com/home',
  title: 'Home Page',
  referrer: 'https://google.com',
});
```

:::

### Identify

::: code-group

```js [Segment (before)]
analytics.identify('user-123', {
  email: 'jane@example.com',
  name: 'Jane Doe',
  plan: 'premium',
});
```

```ts [ODL (after)]
odl.setContext('user', {
  id: 'user-123',
  email: 'jane@example.com',
  isAuthenticated: true,
});
odl.track('user.identified', {
  userId: 'user-123',
  traits: { name: 'Jane Doe', plan: 'premium' },
});
```

:::

### E-commerce: Order Completed

::: code-group

```js [Segment (before)]
analytics.track('Order Completed', {
  order_id: 'ORD-789',
  total: 142.49,
  revenue: 129.99,
  tax: 10.50,
  shipping: 2.00,
  currency: 'USD',
  products: [
    { product_id: 'SKU-1', name: 'Shoes', price: 129.99, quantity: 1 },
  ],
});
```

```ts [ODL (after)]
odl.track('ecommerce.purchase', {
  orderId: 'ORD-789',
  total: 142.49,
  revenue: 129.99,
  tax: 10.50,
  shipping: 2.00,
  currency: 'USD',
  products: [
    { id: 'SKU-1', name: 'Shoes', price: 129.99, quantity: 1 },
  ],
});
```

:::

### Track (Generic Event)

::: code-group

```js [Segment (before)]
analytics.track('Product Viewed', {
  product_id: 'SKU-1',
  name: 'Running Shoes',
  category: 'Footwear',
  price: 129.99,
});
```

```ts [ODL (after)]
odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-1',
    name: 'Running Shoes',
    category: 'Footwear',
    price: 129.99,
  },
});
```

:::

## Step-by-Step Migration

### Phase 1: Install ODL alongside Segment (dual-write)

Install OpenDataLayer and the Segment adapter so both systems receive events:

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-segment
```

```ts
import { OpenDataLayer, debug } from '@opendatalayer/sdk';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

const odl = new OpenDataLayer();

// The Segment adapter routes ODL events to your existing analytics.js
odl.use(segmentAdapter({ autoIdentify: true }));

if (process.env.NODE_ENV === 'development') {
  odl.use(debug());
}
```

At this point, ODL events flow through to Segment as before. Nothing changes downstream.

### Phase 2: Map your events

Create a mapping table from Segment event names to ODL event names:

| Segment Event | ODL Event |
|---------------|-----------|
| `Page Viewed` | `page.view` |
| `Product Viewed` | `ecommerce.product_viewed` |
| `Product Added` | `ecommerce.product_added` |
| `Order Completed` | `ecommerce.purchase` |
| `Products Searched` | `search.performed` |
| `Signed Up` | `user.signed_up` |
| `Signed In` | `user.signed_in` |

The Segment adapter has a default event map that handles these conversions automatically. You can customize it:

```ts
odl.use(segmentAdapter({
  eventNameMap: {
    'custom.newsletter_subscribe': 'Newsletter Subscribed',
    'custom.feature_flag_exposure': 'Feature Flag Exposed',
  },
}));
```

### Phase 3: Move trait management to ODL context

Replace scattered `analytics.identify()` calls with centralized context:

```ts
// Before: Segment identify scattered throughout the app
analytics.identify(userId, { email, plan });

// After: Set context once, it attaches to every event
odl.setContext('user', { id: userId, email, isAuthenticated: true });
odl.track('user.identified', { userId, traits: { plan } });
```

### Phase 4: Add validation

```bash
npm install @opendatalayer/validator
```

```ts
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator({ strict: false });
validator.loadSchemas('./node_modules/@opendatalayer/sdk/schemas');

// Add as middleware
odl.addMiddleware((event, next) => {
  const result = validator.validate(event);
  if (!result.valid) {
    console.warn(`Invalid event "${event.event}":`, result.errors);
  }
  next();
});
```

### Phase 5: Add direct adapters

Once ODL is handling all your events, you can add direct adapters to vendors -- bypassing Segment entirely for those destinations:

```ts
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { amplitudeAdapter } from '@opendatalayer/adapter-amplitude';

// Direct to GTM (no Segment middleman)
odl.use(gtmAdapter());

// Direct to Amplitude (no Segment middleman)
odl.use(amplitudeAdapter({ autoSetUserProperties: true }));

// Keep Segment for destinations you haven't migrated yet
odl.use(segmentAdapter());
```

### Phase 6: Phase out Segment (optional)

Once all your destinations have direct ODL adapters, you can remove the Segment adapter. This eliminates Segment's per-event cost while keeping all your destinations active.

## Event Name Reference

| Segment Spec Event | ODL Event |
|---------------------|-----------|
| `Page` (analytics.page) | `page.view` |
| `Product Viewed` | `ecommerce.product_viewed` |
| `Product List Viewed` | `ecommerce.product_list_viewed` |
| `Product Clicked` | `ecommerce.product_clicked` |
| `Product Added` | `ecommerce.product_added` |
| `Product Removed` | `ecommerce.product_removed` |
| `Cart Viewed` | `ecommerce.cart_viewed` |
| `Checkout Started` | `ecommerce.checkout_started` |
| `Payment Info Entered` | `ecommerce.payment_info_entered` |
| `Order Completed` | `ecommerce.purchase` |
| `Order Refunded` | `ecommerce.refund` |
| `Promotion Viewed` | `ecommerce.promotion_viewed` |
| `Promotion Clicked` | `ecommerce.promotion_clicked` |
| `Products Searched` | `search.performed` |
| `Signed Up` | `user.signed_up` |
| `Signed In` | `user.signed_in` |
| `Signed Out` | `user.signed_out` |

## Property Name Changes

| Segment Property | ODL Property |
|------------------|-------------|
| `product_id` | `id` |
| `order_id` | `orderId` |
| `list_id` | `listId` |
| `image_url` | `imageUrl` |
| `payment_method` | `paymentMethod` |
| `shipping_method` | `shippingMethod` |

Most other property names remain the same (`name`, `price`, `quantity`, `currency`, `brand`, `category`, `variant`, `coupon`).
