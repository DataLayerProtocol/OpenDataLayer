# Adapters

Adapters are plugins that route OpenDataLayer events to third-party analytics providers, CDPs, and marketing tools. Each adapter translates the universal ODL event format into the destination's expected API calls and data shapes.

## How Adapters Work

An adapter is an [ODL plugin](/guide/sdk-usage#using-plugins) that:

1. Listens for events via the `afterEvent` hook.
2. Maps the ODL event name to the destination's event name.
3. Transforms the ODL event data into the destination's expected format.
4. Pushes the transformed event to the destination (dataLayer push, API call, etc.).

Because adapters are plugins, they participate in the full plugin lifecycle -- they can be initialized, receive events, and be cleanly destroyed.

```
 Your Code                 OpenDataLayer SDK               Destinations
+---------+    track()    +-----------------+    push()    +----------+
|  App    | ----------->  |  Event Pipeline | -----------> | GTM      |
|  Code   |               |  (middleware,   |              | Segment  |
|         |               |   validation)   |              | Amplitude|
+---------+               +-----------------+              +----------+
```

## Available Adapters

| Adapter | Package | Status | Description |
|---------|---------|--------|-------------|
| **Google Tag Manager** | `@opendatalayer/adapter-gtm` | Stable | Pushes to `window.dataLayer` with GA4-compatible ecommerce mapping |
| **Segment** | `@opendatalayer/adapter-segment` | Stable | Routes to `analytics.page()`, `analytics.track()`, `analytics.identify()` |
| **Webhook** | `@opendatalayer/adapter-webhook` | Stable | Sends events to any HTTP endpoint via `fetch()` |
| **Adobe Analytics** | `@opendatalayer/adapter-adobe` | Preview | Adobe Analytics / Experience Platform mapping |
| **Amplitude** | `@opendatalayer/adapter-amplitude` | Preview | Amplitude Analytics SDK integration |
| **Piwik PRO / Matomo** | `@opendatalayer/adapter-piwik` | Preview | Piwik PRO and Matomo tracking API |
| **Tealium** | `@opendatalayer/adapter-tealium` | Preview | Tealium iQ / EventStream integration |

::: info
**Stable** adapters have full event mapping, tests, and are production-ready. **Preview** adapters provide the interface and options structure but have incomplete event mapping. Community contributions are welcome -- see [CONTRIBUTING.md](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/CONTRIBUTING.md).
:::

## Google Tag Manager Adapter

The GTM adapter pushes events to `window.dataLayer` in a format that Google Tag Manager and GA4 understand natively. Ecommerce events are automatically mapped to the GA4 ecommerce data model.

### Installation

```bash
npm install @opendatalayer/adapter-gtm
```

### Setup

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { gtmAdapter } from '@opendatalayer/adapter-gtm';

const odl = new OpenDataLayer();

odl.use(gtmAdapter({
  dataLayerName: 'dataLayer',     // custom dataLayer variable name
  includeContext: false,           // include full context in pushes
  flattenData: true,              // flatten nested objects in data
}));
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataLayerName` | `string` | `"dataLayer"` | The `window` property name for the GTM data layer |
| `eventNameMap` | `Record<string, string>` | Built-in GA4 map | Override ODL-to-GTM event name mapping |
| `includeContext` | `boolean` | `false` | Include the full ODL context in each dataLayer push |
| `flattenData` | `boolean` | `true` | Flatten nested data objects (e.g., `product_name` instead of `product.name`) |

### Event name mapping

The adapter maps ODL events to GA4 event names by default:

| ODL Event | GTM/GA4 Event |
|-----------|---------------|
| `page.view` | `page_view` |
| `page.virtual_view` | `virtual_page_view` |
| `ecommerce.product_viewed` | `view_item` |
| `ecommerce.product_list_viewed` | `view_item_list` |
| `ecommerce.product_added` | `add_to_cart` |
| `ecommerce.product_removed` | `remove_from_cart` |
| `ecommerce.cart_viewed` | `view_cart` |
| `ecommerce.checkout_started` | `begin_checkout` |
| `ecommerce.payment_info_entered` | `add_payment_info` |
| `ecommerce.purchase` | `purchase` |
| `ecommerce.refund` | `refund` |
| `user.signed_up` | `sign_up` |
| `user.signed_in` | `login` |
| `search.performed` | `search` |

Events not in the map are converted by replacing dots with underscores (e.g., `form.submitted` becomes `form_submitted`).

### Custom event names

Override or extend the default map:

```ts
odl.use(gtmAdapter({
  eventNameMap: {
    'custom.quiz_completed': 'quiz_complete',
    'interaction.share': 'social_share',
  },
}));
```

### Ecommerce data mapping

For ecommerce events, the adapter automatically maps ODL product objects to the GA4 `items` array format:

```ts
// ODL event
odl.track('ecommerce.purchase', {
  orderId: 'ORD-001',
  revenue: 259.98,
  currency: 'USD',
  products: [
    { id: 'SKU-123', name: 'Running Shoes', brand: 'SpeedRunner', price: 129.99, quantity: 2 },
  ],
});

// Resulting dataLayer push
// {
//   event: 'purchase',
//   ecommerce: {
//     transaction_id: 'ORD-001',
//     value: 259.98,
//     currency: 'USD',
//     items: [{
//       item_id: 'SKU-123',
//       item_name: 'Running Shoes',
//       item_brand: 'SpeedRunner',
//       price: 129.99,
//       quantity: 2
//     }]
//   },
//   odl_event_id: '...',
//   odl_timestamp: '...'
// }
```

### Metadata

Every push includes `odl_event_id` and `odl_timestamp` for traceability between ODL and GTM.

## Segment Adapter

The Segment adapter routes events to Segment's `analytics.js` library, automatically calling the right method (`page`, `track`, or `identify`) based on the event type.

### Installation

```bash
npm install @opendatalayer/adapter-segment
```

### Setup

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

const odl = new OpenDataLayer();

odl.use(segmentAdapter({
  autoIdentify: true,      // auto-call identify() when user context changes
  includeMetadata: false,   // include odl_event_id/odl_timestamp in properties
}));
```

::: warning
The Segment adapter expects `analytics.js` to already be loaded on the page. If it is not found, the adapter logs a warning and silently skips events.
:::

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `analyticsInstance` | `SegmentAnalytics` | `window.analytics` | Custom analytics.js instance |
| `eventNameMap` | `Record<string, string>` | Built-in Segment spec map | Override ODL-to-Segment event name mapping |
| `autoIdentify` | `boolean` | `true` | Automatically call `analytics.identify()` when user context changes |
| `includeMetadata` | `boolean` | `false` | Include `odl_event_id` and `odl_timestamp` in event properties |

### Routing logic

The adapter routes events to Segment methods based on the event type:

| ODL Event Pattern | Segment Method | Details |
|-------------------|----------------|---------|
| `page.*` | `analytics.page()` | Title and URL passed as page properties |
| `user.identified` | `analytics.identify()` | User ID and traits extracted from event data |
| All other events | `analytics.track()` | Mapped to Segment spec names |

### Event name mapping

The adapter maps ODL events to Segment's e-commerce spec names:

| ODL Event | Segment Event |
|-----------|---------------|
| `ecommerce.product_viewed` | `Product Viewed` |
| `ecommerce.product_added` | `Product Added` |
| `ecommerce.purchase` | `Order Completed` |
| `ecommerce.refund` | `Order Refunded` |
| `user.signed_up` | `Signed Up` |
| `user.signed_in` | `Signed In` |
| `search.performed` | `Products Searched` |

Events not in the map are title-cased with spaces (e.g., `form.submitted` becomes `Form Submitted`).

### Auto-identification

When `autoIdentify` is enabled (the default), the adapter watches the `user` context on every event. If a `user.id` is present and has changed since the last identification, it calls `analytics.identify(userId, traits)` automatically.

```ts
// This setContext + any subsequent track will trigger identify()
odl.setContext('user', {
  id: 'u-789',
  isAuthenticated: true,
  traits: { email: 'jane@example.com' },
});

odl.track('page.view'); // triggers identify('u-789', { email: 'jane@example.com' })
```

## Writing a Custom Adapter

A custom adapter is simply a function that returns an `ODLPlugin`. At minimum, implement `afterEvent` to receive events and forward them to your destination.

### Minimal example

```ts
import type { ODLPlugin } from '@opendatalayer/sdk';

interface MyAdapterOptions {
  apiKey: string;
  endpoint?: string;
}

function myAdapter(options: MyAdapterOptions): ODLPlugin {
  const { apiKey, endpoint = 'https://api.example.com/events' } = options;

  return {
    name: 'my-custom-adapter',

    initialize() {
      console.log('My adapter initialized');
    },

    afterEvent(event) {
      // Transform to destination format
      const payload = {
        name: event.event,
        properties: event.data ?? {},
        timestamp: event.timestamp,
        userId: (event.context?.user as Record<string, unknown>)?.id,
      };

      // Send to destination
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('[my-adapter] Failed to send event:', err);
      });
    },

    destroy() {
      console.log('My adapter destroyed');
    },
  };
}
```

### Filtering events

You may want your adapter to only handle certain events:

```ts
afterEvent(event) {
  // Only forward ecommerce and page events
  if (!event.event.startsWith('ecommerce.') && !event.event.startsWith('page.')) {
    return;
  }

  // ... forward to destination
}
```

### Respecting consent

A well-behaved adapter checks the consent context before sending data:

```ts
afterEvent(event) {
  const consent = event.context?.consent as Record<string, boolean> | undefined;

  // Only send if analytics consent is granted
  if (!consent?.analytics) {
    return;
  }

  // ... forward to destination
}
```

### Batching events

For high-volume scenarios, buffer events and send them in batches:

```ts
function batchAdapter(options: { endpoint: string; batchSize?: number }): ODLPlugin {
  const { endpoint, batchSize = 10 } = options;
  let buffer: unknown[] = [];
  let flushTimer: ReturnType<typeof setInterval> | undefined;

  function flush() {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    }).catch(console.error);
  }

  return {
    name: 'batch-adapter',

    initialize() {
      // Flush every 5 seconds
      flushTimer = setInterval(flush, 5000);
    },

    afterEvent(event) {
      buffer.push({ name: event.event, data: event.data, ts: event.timestamp });
      if (buffer.length >= batchSize) {
        flush();
      }
    },

    destroy() {
      if (flushTimer) clearInterval(flushTimer);
      flush(); // send remaining events
    },
  };
}
```

## Multiple Adapters

You can register as many adapters as you need. Each adapter runs independently in its `afterEvent` hook.

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

const odl = new OpenDataLayer();

// Both adapters receive every event
odl.use(gtmAdapter());
odl.use(segmentAdapter({ autoIdentify: true }));

// A custom webhook for server-side processing
odl.use(batchAdapter({ endpoint: 'https://api.example.com/collect' }));
```

::: tip
Each adapter is isolated -- an error in one adapter will not prevent other adapters from receiving the event. The SDK wraps each `afterEvent` call in a try/catch.
:::

### Adapter ordering

Adapters run in the order they are registered. If ordering matters (for example, one adapter enriches events for another), register them in the correct sequence:

```ts
odl.use(enrichmentPlugin());  // modifies events
odl.use(gtmAdapter());        // receives enriched events
odl.use(segmentAdapter());    // receives enriched events
```

## Next Steps

- See the [SDK Usage](/guide/sdk-usage) guide for the full plugin API.
- Browse the [Event Reference](/reference/events) for all event types adapters need to handle.
- Read about [Validation](/guide/validation) to ensure events are well-formed before they reach adapters.
