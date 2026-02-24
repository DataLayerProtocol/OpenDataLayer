---
title: Migrating from GTM dataLayer
description: Step-by-step guide to migrating from Google Tag Manager's dataLayer to OpenDataLayer
---

# Migrating from GTM dataLayer

If your site uses `dataLayer.push()` calls to feed Google Tag Manager, you already have the hardest part done: your team understands event-driven tracking. This guide shows how to adopt OpenDataLayer incrementally, without breaking your existing GTM setup, and explains what you gain by making the switch.

## Why Migrate

If `dataLayer.push()` is working, why change? Here are the concrete problems ODL solves:

| Problem | dataLayer | OpenDataLayer |
|---------|-----------|---------------|
| **Vendor lock-in** | Event schema is shaped for GA4/GTM. Switching to another vendor means re-instrumenting. | Vendor-neutral event format. Adapters handle the translation. |
| **Type safety** | No types. A typo in a property name silently breaks reporting. | Full TypeScript types auto-generated from JSON Schemas. |
| **Validation** | None. Bad data flows silently to production. | Schema + semantic validation catches issues in dev and CI. |
| **Multi-vendor** | Adding a second vendor means duplicating every `push()` call or building a custom abstraction. | Register multiple adapters; every vendor receives every event. |
| **Context management** | User ID, page info, and consent state are scattered across dataLayer variables. | Centralized context that auto-attaches to every event. |
| **Consent enforcement** | Consent logic lives in GTM triggers, invisible to developers. | Consent is part of the event model. Adapters and validation rules enforce it in code. |

## Side-by-Side Comparison

### Page View

::: code-group

```js [dataLayer (before)]
dataLayer.push({
  event: 'page_view',
  page_title: 'Running Shoes - Example Store',
  page_location: 'https://example.com/products/running-shoes',
  page_referrer: 'https://www.google.com/',
});
```

```ts [ODL (after)]
odl.setContext('page', {
  url: 'https://example.com/products/running-shoes',
  title: 'Running Shoes - Example Store',
  path: '/products/running-shoes',
  referrer: 'https://www.google.com/',
  type: 'product',
});

odl.track('page.view');
```

:::

Notice the difference: with ODL, page metadata lives in **context** (set once, attached to all events), and the `track()` call is clean. With `dataLayer.push()`, you repeat page fields on every call or maintain a complex GTM variable setup.

### Purchase

::: code-group

```js [dataLayer (before)]
dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'ORD-001',
    value: 259.98,
    currency: 'USD',
    tax: 22.50,
    shipping: 5.99,
    items: [
      {
        item_id: 'SKU-123',
        item_name: 'Running Shoes',
        item_brand: 'SpeedRunner',
        item_category: 'Footwear/Running',
        price: 129.99,
        quantity: 2,
      },
    ],
  },
});
```

```ts [ODL (after)]
odl.track('ecommerce.purchase', {
  orderId: 'ORD-001',
  revenue: 259.98,
  currency: 'USD',
  tax: 22.50,
  shipping: 5.99,
  products: [
    {
      id: 'SKU-123',
      name: 'Running Shoes',
      brand: 'SpeedRunner',
      category: 'Footwear/Running',
      price: 129.99,
      quantity: 2,
    },
  ],
});
```

:::

No manual `ecommerce: null` clearing. No GA4-specific `item_id` / `item_name` naming. The GTM adapter handles the translation automatically.

### User Login

::: code-group

```js [dataLayer (before)]
dataLayer.push({
  event: 'login',
  method: 'email',
  user_id: 'user-789',
});
```

```ts [ODL (after)]
odl.setContext('user', {
  id: 'user-789',
  isAuthenticated: true,
});

odl.track('user.signed_in', {
  method: 'email',
});
```

:::

With ODL, the user identity is set in context once and automatically attached to every subsequent event. No need to push `user_id` on every dataLayer call.

## Step-by-Step Migration

This is a phased approach. At no point do you need to do a "big bang" cutover. ODL and your existing `dataLayer.push()` calls coexist safely during the entire migration.

### Phase 1: Install ODL with the GTM Adapter (Dual-Write)

Install ODL and the GTM adapter. Configure it to push to the same `window.dataLayer` that GTM already reads from. This means ODL events are immediately visible in GTM -- nothing breaks.

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-gtm
```

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { gtmAdapter } from '@opendatalayer/adapter-gtm';

const odl = new OpenDataLayer();

odl.use(gtmAdapter({
  // Push to the same dataLayer GTM reads from
  dataLayerName: 'dataLayer',
  // Include context in pushes so GTM can read it
  includeContext: true,
}));

// Make odl available globally for the migration period
window.odl = odl;
```

At this point, both systems coexist. Your existing `dataLayer.push()` calls continue to work. New code can start using `odl.track()`.

::: tip
During this phase, events tracked through ODL will appear in GTM as normal dataLayer events. You can verify this in GTM's Preview mode -- look for events with `odl_event_id` and `odl_timestamp` properties.
:::

### Phase 2: Map Existing Events to ODL Names

Create a mapping document that maps your current dataLayer event names to ODL standard events. The GTM adapter handles the reverse mapping (ODL to GA4 names) automatically, but you need to know which ODL event to call.

| Your Current dataLayer Event | ODL Event | Notes |
|------------------------------|-----------|-------|
| `page_view` | `page.view` | Move page data to context |
| `view_item` | `ecommerce.product_viewed` | Wrap item in `product` |
| `view_item_list` | `ecommerce.product_list_viewed` | Wrap items in `products` |
| `select_item` | `ecommerce.product_clicked` | |
| `add_to_cart` | `ecommerce.product_added` | |
| `remove_from_cart` | `ecommerce.product_removed` | |
| `view_cart` | `ecommerce.cart_viewed` | |
| `begin_checkout` | `ecommerce.checkout_started` | |
| `add_payment_info` | `ecommerce.payment_info_entered` | |
| `purchase` | `ecommerce.purchase` | |
| `refund` | `ecommerce.refund` | |
| `login` | `user.signed_in` | |
| `sign_up` | `user.signed_up` | |
| `search` | `search.performed` | |
| `share` | `interaction.share` | |
| `file_download` | `interaction.file_downloaded` | |
| (custom events) | `custom.your_event_name` | |

### Phase 3: Map Enhanced Ecommerce to ODL Ecommerce Events

If you are using GA4 Enhanced Ecommerce, the GTM adapter already knows how to translate ODL's product model to GA4's `items` array. Here is the field mapping:

| GA4 Enhanced Ecommerce Field | ODL Product Field |
|------------------------------|-------------------|
| `item_id` | `id` |
| `item_name` | `name` |
| `item_brand` | `brand` |
| `item_category` | `category` |
| `item_variant` | `variant` |
| `price` | `price` |
| `quantity` | `quantity` |
| `coupon` | `coupon` |
| `discount` | `discount` |
| `index` | `position` |

**Before (GA4 Enhanced Ecommerce):**

```js
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'view_item_list',
  ecommerce: {
    item_list_id: 'related_products',
    item_list_name: 'Related Products',
    items: [
      {
        item_id: 'SKU-100',
        item_name: 'Trail Shoes',
        item_brand: 'HikePro',
        item_category: 'Footwear',
        price: 89.99,
        index: 0,
      },
      {
        item_id: 'SKU-101',
        item_name: 'Hiking Boots',
        item_brand: 'HikePro',
        item_category: 'Footwear',
        price: 149.99,
        index: 1,
      },
    ],
  },
});
```

**After (ODL):**

```ts
odl.track('ecommerce.product_list_viewed', {
  listId: 'related_products',
  listName: 'Related Products',
  products: [
    {
      id: 'SKU-100',
      name: 'Trail Shoes',
      brand: 'HikePro',
      category: 'Footwear',
      price: 89.99,
      position: 0,
    },
    {
      id: 'SKU-101',
      name: 'Hiking Boots',
      brand: 'HikePro',
      category: 'Footwear',
      price: 149.99,
      position: 1,
    },
  ],
});
```

The GTM adapter converts this back to the GA4 format automatically. Your GTM tags and triggers keep working with zero changes.

### Phase 4: Add Context Management

Replace scattered dataLayer variables with centralized ODL context. This is where you get the biggest developer experience improvement.

**Before:** Scattered across your codebase:

```js
// In your auth module
dataLayer.push({ user_id: 'u-789', user_type: 'premium' });

// In your page template
dataLayer.push({ page_type: 'product', page_category: 'footwear' });

// In your consent banner
dataLayer.push({ consent_analytics: true, consent_marketing: false });

// Then in every subsequent push, you hope these values are available in GTM
dataLayer.push({ event: 'view_item', ecommerce: { /* ... */ } });
```

**After:** Set context once, it auto-attaches:

```ts
// In your auth module
odl.setContext('user', {
  id: 'u-789',
  isAuthenticated: true,
  traits: { role: 'premium' },
});

// In your page component / router
odl.setContext('page', {
  url: window.location.href,
  title: document.title,
  path: window.location.pathname,
  type: 'product',
});

// In your consent banner
odl.setContext('consent', {
  analytics: true,
  marketing: false,
  method: 'explicit',
});

// Every subsequent track() call includes all context automatically
odl.track('ecommerce.product_viewed', {
  product: { id: 'SKU-123', name: 'Running Shoes', price: 129.99 },
  currency: 'USD',
});
// The resulting event envelope includes user, page, and consent context
```

### Phase 5: Add Validation

Install the validator to catch instrumentation bugs before they reach production:

```bash
npm install @opendatalayer/validator
```

```ts
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator();

// Development-only validation middleware
if (process.env.NODE_ENV === 'development') {
  odl.addMiddleware((event, next) => {
    const result = validator.validate(event);
    if (!result.valid) {
      console.error(`[ODL] Invalid event "${event.event}":`, result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn(`[ODL] Warnings for "${event.event}":`, result.warnings);
    }
    next();
  });
}
```

Add CLI validation to your CI pipeline:

```yaml
# .github/workflows/validate-events.yml
- run: npx odl validate test-events/ --strict --format junit > results.xml
```

### Phase 6: Gradually Phase Out Direct dataLayer Pushes

Once you have confirmed that ODL events are flowing correctly through GTM (check GTM Preview mode), start removing direct `dataLayer.push()` calls. Work through one file or feature at a time.

**Migration checklist per file:**

- [ ] Replace `dataLayer.push({ event: '...' })` with `odl.track('...')`
- [ ] Move page/user data from push calls to `odl.setContext()`
- [ ] Remove `ecommerce: null` clearing calls (ODL handles this)
- [ ] Replace GA4 field names (`item_id`) with ODL field names (`id`)
- [ ] Verify in GTM Preview that the events still arrive correctly

## Common GTM Patterns and Their ODL Equivalents

### Form Submission

::: code-group

```js [dataLayer (before)]
dataLayer.push({
  event: 'form_submit',
  form_id: 'contact-form',
  form_name: 'Contact Us',
  form_destination: '/thank-you',
});
```

```ts [ODL (after)]
odl.track('form.submitted', {
  formId: 'contact-form',
  formName: 'Contact Us',
  formType: 'contact',
});
```

:::

### Custom Event

::: code-group

```js [dataLayer (before)]
dataLayer.push({
  event: 'quiz_complete',
  quiz_id: 'product-finder',
  quiz_score: 85,
  quiz_result: 'Trail Runner',
});
```

```ts [ODL (after)]
odl.track('custom.quiz_completed', {
  quizId: 'product-finder',
  score: 85,
  result: 'Trail Runner',
});
```

:::

### Promotion Impressions

::: code-group

```js [dataLayer (before)]
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'view_promotion',
  ecommerce: {
    items: [{
      promotion_id: 'summer-banner',
      promotion_name: 'Summer Sale',
      creative_name: 'hero-banner-v2',
      creative_slot: 'homepage-hero',
    }],
  },
});
```

```ts [ODL (after)]
odl.track('ecommerce.promotion_viewed', {
  promotion: {
    id: 'summer-banner',
    name: 'Summer Sale',
    creative: 'hero-banner-v2',
    position: 'homepage-hero',
  },
});
```

:::

### Product Click from List

::: code-group

```js [dataLayer (before)]
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'select_item',
  ecommerce: {
    item_list_id: 'search_results',
    item_list_name: 'Search Results',
    items: [{
      item_id: 'SKU-123',
      item_name: 'Running Shoes',
      item_brand: 'SpeedRunner',
      price: 129.99,
      index: 3,
    }],
  },
});
```

```ts [ODL (after)]
odl.track('ecommerce.product_clicked', {
  product: {
    id: 'SKU-123',
    name: 'Running Shoes',
    brand: 'SpeedRunner',
    price: 129.99,
    position: 3,
  },
  listId: 'search_results',
  listName: 'Search Results',
});
```

:::

## GTM Adapter Configuration

### Default Event Name Mapping

The GTM adapter ships with a default mapping from ODL events to GA4-compatible event names:

```ts
const DEFAULT_EVENT_MAP = {
  'page.view':                         'page_view',
  'page.virtual_view':                 'virtual_page_view',
  'ecommerce.product_viewed':          'view_item',
  'ecommerce.product_list_viewed':     'view_item_list',
  'ecommerce.product_clicked':         'select_item',
  'ecommerce.product_added':           'add_to_cart',
  'ecommerce.product_removed':         'remove_from_cart',
  'ecommerce.cart_viewed':             'view_cart',
  'ecommerce.checkout_started':        'begin_checkout',
  'ecommerce.checkout_step_completed': 'checkout_progress',
  'ecommerce.payment_info_entered':    'add_payment_info',
  'ecommerce.purchase':                'purchase',
  'ecommerce.refund':                  'refund',
  'ecommerce.promotion_viewed':        'view_promotion',
  'ecommerce.promotion_clicked':       'select_promotion',
  'user.signed_up':                    'sign_up',
  'user.signed_in':                    'login',
  'search.performed':                  'search',
  'interaction.share':                 'share',
  'interaction.file_downloaded':       'file_download',
};
```

### Custom Overrides

If your GTM setup uses non-standard event names, override the mapping:

```ts
odl.use(gtmAdapter({
  eventNameMap: {
    'custom.quiz_completed': 'quiz_complete',
    'form.submitted': 'form_submission',
    'interaction.share': 'social_share',
  },
}));
```

### Full Options Reference

```ts
odl.use(gtmAdapter({
  // Name of the window property for the data layer (default: 'dataLayer')
  dataLayerName: 'dataLayer',

  // Override default ODL-to-GTM event name mappings
  eventNameMap: {},

  // Include full ODL context in every dataLayer push (default: false)
  includeContext: false,

  // Flatten nested data objects into underscore-separated keys (default: true)
  flattenData: true,
}));
```

## Coexistence Strategy

During migration, ODL and direct `dataLayer.push()` calls coexist on the same page. Here is how it works:

```
 Your Code               ODL                         GTM
+------------------+    +---------+    push()     +---------+
| odl.track()      |--->| ODL SDK |--->dataLayer-->|  GTM    |
+------------------+    +---------+                |         |
                                                   |         |
+------------------+            push()             |         |
| dataLayer.push() |----------------------------->|         |
+------------------+                               +---------+
```

Both paths push to the same `window.dataLayer`. GTM does not know or care which one produced the event. This means:

1. **Existing triggers keep working.** Your GTM tags that listen for `purchase`, `page_view`, etc. will fire for both old `dataLayer.push()` calls and new ODL-routed events.

2. **You can migrate one event at a time.** Convert `page_view` to ODL today, leave `purchase` as a direct push until next sprint. There is no deadline.

3. **ODL events are identifiable.** Every ODL-routed event includes `odl_event_id` and `odl_timestamp`, so you can filter them in GTM Preview or in your own debugging.

### Adding Other Vendors During Migration

One of the key advantages of migrating to ODL is that you can add other analytics vendors without duplicating instrumentation. While GTM stays as one adapter, you can add Segment, Amplitude, or any other adapter in parallel:

```ts
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

const odl = new OpenDataLayer();

// GTM continues to work as before
odl.use(gtmAdapter());

// Segment receives the same events with no additional instrumentation
odl.use(segmentAdapter({ autoIdentify: true }));
```

## Migration Timeline

Here is a realistic timeline for a mid-size site (50-100 tracking calls):

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 1: Install + dual-write | 1 day | None -- additive only |
| Phase 2: Map events | 1-2 days | None -- documentation only |
| Phase 3: Map ecommerce | 2-3 days | Low -- GTM adapter handles translation |
| Phase 4: Add context | 1-2 days | None -- additive |
| Phase 5: Add validation | 1 day | None -- dev/CI only |
| Phase 6: Remove old pushes | 1-3 weeks | Medium -- requires QA per page/feature |

The entire migration can be spread over a quarter with zero downtime and zero data loss.

## Troubleshooting

### Events appear twice in GTM Preview

If you see duplicate events, you are likely pushing the same event through both `dataLayer.push()` and `odl.track()`. During migration this is expected for events you have not yet converted. Once you remove the old `dataLayer.push()` call, the duplicate disappears.

### Ecommerce data is not in the expected format

Make sure you are using ODL's product model (with `id`, `name`, `brand`) rather than GA4's item model (`item_id`, `item_name`, `item_brand`). The adapter performs the translation.

### Custom dimensions are not appearing in GTM

Verify you are passing custom dimensions as the third argument to `track()`:

```ts
odl.track('page.view', {}, {
  contentGroup: 'blog',
  authorId: 'author-42',
});
// These appear as top-level properties in the dataLayer push
```

## Next Steps

- Read the [Adapters guide](/guide/adapters) for the full GTM adapter reference.
- Explore the [Event Reference](/reference/events) for all standard event types.
- Set up [Validation](/guide/validation) to catch instrumentation bugs early.
- Consider adding a second adapter (Segment, Amplitude) to start multi-vendor tracking.
