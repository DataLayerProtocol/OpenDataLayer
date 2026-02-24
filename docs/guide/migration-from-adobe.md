---
title: Migrating from Adobe Analytics
description: Step-by-step guide to adding OpenDataLayer alongside Adobe Analytics
---

# Migrating from Adobe Analytics

If your organization uses Adobe Analytics (AppMeasurement or AEP Web SDK), you know the power of enterprise analytics -- but also the pain of `s.products` string building, eVar/prop sprawl, and vendor-specific code throughout your application. This guide shows how to adopt OpenDataLayer alongside Adobe without disrupting your existing implementation.

## Why Add ODL

| Challenge | Adobe Direct | With OpenDataLayer |
|-----------|-------------|-------------------|
| **Developer experience** | Building `s.products` strings, managing `s.events`, setting eVars by index number. | Structured objects: `{ id, name, price, quantity }`. The adapter builds the product string. |
| **Multi-vendor** | Adding another vendor means duplicating all tracking calls. | Register multiple adapters. Track once, deliver everywhere. |
| **Type safety** | No types. `s.eVar47 = value` gives no compile-time help. | Full TypeScript types. `customDimensions.userType` maps to `eVar47` via config. |
| **Validation** | No schema validation. Bad data shows up in reports days later. | Catch invalid events in development and CI. |
| **Code readability** | `s.events = 'event5'; s.eVar12 = 'premium'; s.tl(true,'o','click');` | `odl.track('interaction.click', { ... }, { userType: 'premium' })` |
| **Migration path** | Locked to Adobe's implementation pattern. | Vendor-neutral. Switch or add vendors without re-instrumenting. |

## Side-by-Side Comparison

### Page View

::: code-group

```js [Adobe (before)]
s.pageName = 'Home Page';
s.channel = 'homepage';
s.prop1 = 'logged-in';
s.eVar5 = 'premium';
s.t();
```

```ts [ODL (after)]
odl.track('page.view', {
  title: 'Home Page',
  channel: 'homepage',
}, {
  loginStatus: 'logged-in',  // mapped to prop1 via config
  userTier: 'premium',        // mapped to eVar5 via config
});
```

:::

### Product View

::: code-group

```js [Adobe (before)]
s.events = 'prodView';
s.products = 'Footwear;Running Shoes;;;';
s.eVar1 = 'SKU-123';
s.tl(true, 'o', 'prodView');
```

```ts [ODL (after)]
odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-123',
    name: 'Running Shoes',
    category: 'Footwear',
    price: 129.99,
  },
});
```

:::

### Purchase

::: code-group

```js [Adobe (before)]
s.events = 'purchase';
s.products = 'Footwear;Running Shoes;1;129.99,Accessories;Socks;2;9.99';
s.purchaseID = 'ORD-789';
s.eVar10 = 'USD';
s.t();
```

```ts [ODL (after)]
odl.track('ecommerce.purchase', {
  orderId: 'ORD-789',
  total: 149.97,
  currency: 'USD',
  products: [
    { id: 'SKU-1', name: 'Running Shoes', category: 'Footwear', price: 129.99, quantity: 1 },
    { id: 'SKU-2', name: 'Socks', category: 'Accessories', price: 9.99, quantity: 2 },
  ],
});
```

:::

### Custom Link Tracking

::: code-group

```js [Adobe (before)]
s.events = 'event5';
s.eVar12 = 'hero-banner';
s.prop5 = 'Summer Sale';
s.tl(true, 'o', 'banner_click');
s.clearVars();
```

```ts [ODL (after)]
odl.track('interaction.click', {
  name: 'banner_click',
  label: 'Summer Sale',
}, {
  bannerPosition: 'hero-banner',  // mapped to eVar12 via config
});
// clearVars() called automatically by the adapter
```

:::

## Step-by-Step Migration

### Phase 1: Install ODL + Adobe adapter

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-adobe
```

```ts
import { OpenDataLayer, debug } from '@opendatalayer/sdk';
import { adobeAdapter } from '@opendatalayer/adapter-adobe';

const odl = new OpenDataLayer();

odl.use(adobeAdapter({
  mode: 'appmeasurement',  // or 'websdk' for AEP Web SDK

  // Map your human-readable dimension names to Adobe variables
  eVarMap: {
    userTier: 'eVar5',
    loginStatus: 'eVar7',
    bannerPosition: 'eVar12',
    searchQuery: 'eVar15',
  },

  propMap: {
    loginStatus: 'prop1',
    pageType: 'prop3',
  },
}));

if (process.env.NODE_ENV === 'development') {
  odl.use(debug());
}
```

Your existing `s.t()` and `s.tl()` calls continue to work. ODL sends events in parallel.

### Phase 2: Map your events

Create a mapping from your existing Adobe events to ODL events:

| Adobe Pattern | ODL Event |
|---------------|-----------|
| `s.t()` with `s.pageName` | `page.view` |
| `s.events = 'prodView'` | `ecommerce.product_viewed` |
| `s.events = 'scAdd'` | `ecommerce.product_added` |
| `s.events = 'scRemove'` | `ecommerce.product_removed` |
| `s.events = 'purchase'` | `ecommerce.purchase` |
| `s.events = 'scCheckout'` | `ecommerce.checkout_started` |
| `s.events = 'event1'` (custom) | Map to your domain event, e.g. `user.signed_up` |

The adapter handles these reverse mappings automatically. You can customize:

```ts
odl.use(adobeAdapter({
  eventNameMap: {
    'user.signed_up': 'event1',
    'user.signed_in': 'event2',
    'interaction.video_start': 'event10',
    'interaction.video_complete': 'event11',
  },
}));
```

### Phase 3: Replace product string building

This is where ODL saves the most developer time. Instead of building product strings manually:

```ts
// Before: error-prone string concatenation
s.products = items
  .map(i => `${i.category};${i.name};${i.qty};${i.price}`)
  .join(',');
```

Just pass structured data:

```ts
// After: the adapter builds the string for you
odl.track('ecommerce.purchase', {
  orderId: 'ORD-789',
  products: items.map(i => ({
    id: i.sku,
    name: i.name,
    category: i.category,
    price: i.price,
    quantity: i.qty,
  })),
});
```

### Phase 4: Map eVars and props to semantic names

Instead of `s.eVar47 = value` scattered throughout your code, define the mapping once:

```ts
odl.use(adobeAdapter({
  eVarMap: {
    userType: 'eVar1',
    membershipLevel: 'eVar2',
    experimentVariant: 'eVar3',
    contentType: 'eVar4',
    searchQuery: 'eVar15',
    // Add all your eVar mappings here
  },
  propMap: {
    pageSection: 'prop1',
    loginStatus: 'prop2',
    serverRegion: 'prop5',
  },
}));

// Then in your tracking code, use semantic names:
odl.track('page.view', { title: 'Dashboard' }, {
  userType: 'premium',          // -> eVar1
  membershipLevel: 'gold',      // -> eVar2
  pageSection: 'account',       // -> prop1
});
```

### Phase 5: Add validation

```bash
npm install @opendatalayer/validator
```

```ts
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator();

odl.addMiddleware((event, next) => {
  const result = validator.validate(event);
  if (!result.valid) {
    console.warn(`[ODL] Invalid event "${event.event}":`, result.errors);
  }
  next();
});
```

### Phase 6: Add more vendors

With ODL handling all your tracking, adding another vendor is one line:

```ts
import { amplitudeAdapter } from '@opendatalayer/adapter-amplitude';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

// Product analytics
odl.use(amplitudeAdapter());

// Customer data platform
odl.use(segmentAdapter());

// Keep Adobe as well
odl.use(adobeAdapter({ mode: 'appmeasurement', eVarMap: { ... } }));
```

## AEP Web SDK Mode

If you're using Adobe Experience Platform Web SDK (alloy) instead of AppMeasurement:

```ts
odl.use(adobeAdapter({
  mode: 'websdk',
  eventNameMap: {
    // Custom event type mappings for XDM
    'user.signed_up': 'userSignUp',
    'interaction.video_start': 'media.sessionStart',
  },
}));
```

The WebSDK mode maps events to XDM schema format:
- Page events -> `xdm.web.webPageDetails`
- Ecommerce -> `xdm.commerce` + `xdm.productListItems`
- Search -> `xdm.siteSearch`
- Custom dimensions -> `data` object alongside XDM

## eVar/Prop Reference Template

Use this template to document your organization's eVar and prop mappings:

```ts
// adobe-mapping.ts -- single source of truth for Adobe variable assignments
export const EVAR_MAP: Record<string, string> = {
  // User dimensions
  userType: 'eVar1',
  membershipLevel: 'eVar2',
  loginMethod: 'eVar3',

  // Content dimensions
  contentType: 'eVar10',
  articleCategory: 'eVar11',
  authorName: 'eVar12',

  // Campaign dimensions
  internalPromotion: 'eVar20',
  experimentId: 'eVar21',
  experimentVariant: 'eVar22',

  // Search
  searchQuery: 'eVar30',
  searchResultCount: 'eVar31',
};

export const PROP_MAP: Record<string, string> = {
  pageSection: 'prop1',
  pageSubSection: 'prop2',
  loginStatus: 'prop3',
  serverRegion: 'prop5',
};
```

Then import it:

```ts
import { EVAR_MAP, PROP_MAP } from './adobe-mapping';

odl.use(adobeAdapter({
  mode: 'appmeasurement',
  eVarMap: EVAR_MAP,
  propMap: PROP_MAP,
}));
```
