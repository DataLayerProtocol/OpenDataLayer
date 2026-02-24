# SDK Usage

The `@opendatalayer/sdk` package is the core runtime library. It manages the event pipeline, ambient context, subscriptions, plugins, and middleware. This guide covers everything you need to instrument an application end-to-end.

## Installation

::: code-group

```bash [npm]
npm install @opendatalayer/sdk
```

```bash [yarn]
yarn add @opendatalayer/sdk
```

```bash [pnpm]
pnpm add @opendatalayer/sdk
```

:::

For compile-time type safety on event payloads, also install the types package:

```bash
npm install @opendatalayer/types
```

## Initialization

Import the `OpenDataLayer` class and create an instance at your application's entry point. The instance should be a singleton -- create it once and share it wherever tracking is needed.

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';

const odl = new OpenDataLayer();
```

### Options

The constructor accepts an optional `ODLOptions` object:

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { debug, persistence, autoPageView } from '@opendatalayer/sdk';

const odl = new OpenDataLayer({
  // Plugins to register immediately
  plugins: [
    debug({ verbose: true }),
    persistence({ maxEvents: 200 }),
    autoPageView({ trackHistory: true }),
  ],

  // Initial ambient context (attached to every event)
  context: {
    app: {
      name: 'My Store',
      version: '2.4.1',
      environment: 'production',
      platform: 'web',
    },
  },

  // Source metadata stamped on every event
  source: {
    name: 'my-store-web',
    version: '2.4.1',
  },
});
```

| Option | Type | Description |
|--------|------|-------------|
| `plugins` | `ODLPlugin[]` | Plugins to register on construction. Each plugin's `initialize` hook is called immediately. |
| `context` | `Record<string, unknown>` | Initial context keyed by domain (e.g., `page`, `user`, `app`). Merged into every event. |
| `source` | `{ name: string; version: string }` | Source metadata attached to every event envelope. |

## Tracking Events

The `track` method is the primary way to record that something happened.

```ts
odl.track('page.view');
```

### Event data

Pass an optional second argument with event-specific data:

```ts
odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-123',
    name: 'Running Shoes',
    brand: 'SpeedRunner',
    category: 'Footwear/Running',
    price: 129.99,
  },
  currency: 'USD',
});
```

### Custom dimensions

A third argument lets you attach flat key-value custom dimensions for analytics tools that support them:

```ts
odl.track(
  'page.view',
  { title: 'Homepage', url: 'https://example.com/' },
  { experiment_id: 'exp-42', variant: 'B' },
);
```

### Return value

`track` returns the full `ODLEvent` envelope, which is useful for debugging or chaining:

```ts
const event = odl.track('form.submitted', { formId: 'contact-us' });
console.log(event.id);        // UUID v4
console.log(event.timestamp); // ISO 8601
console.log(event.context);   // snapshot of ambient context at track time
```

### Event envelope structure

Every call to `track` produces a structured envelope:

```json
{
  "event": "ecommerce.purchase",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-23T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": {
    "page": { "url": "https://example.com/checkout/complete", "title": "Order Confirmed" },
    "user": { "id": "u-789", "isAuthenticated": true }
  },
  "data": {
    "orderId": "ORD-001",
    "revenue": 259.98,
    "currency": "USD",
    "products": [{ "id": "SKU-123", "name": "Running Shoes", "price": 129.99, "quantity": 2 }]
  },
  "customDimensions": { "couponSource": "email" }
}
```

## Managing Context

Context is persistent metadata that the SDK attaches to every event automatically. Set it once, and it flows through until you change it.

### setContext

Replace a context domain entirely:

```ts
// Set page context on every route change
odl.setContext('page', {
  url: window.location.href,
  path: window.location.pathname,
  title: document.title,
  referrer: document.referrer,
});

// Set user context after login
odl.setContext('user', {
  id: 'u-789',
  isAuthenticated: true,
  traits: { email: 'jane@example.com', loyaltyTier: 'gold' },
});
```

### updateContext

Deep-merge partial updates into an existing context domain. Existing keys that are not mentioned are left untouched.

```ts
// User earns a new loyalty tier -- only update that field
odl.updateContext('user', {
  traits: { loyaltyTier: 'platinum' },
});
// Result: user.id, user.isAuthenticated, user.traits.email are preserved;
//         user.traits.loyaltyTier is updated to "platinum"
```

### getContext

Read the current context snapshot:

```ts
const ctx = odl.getContext();
console.log(ctx.user); // { id: 'u-789', isAuthenticated: true, ... }
```

### Standard context domains

| Domain | Purpose | When to set |
|--------|---------|-------------|
| `page` | Current URL, path, title, referrer | Every page/route change |
| `user` | User ID, auth state, traits | Login, logout, profile update |
| `consent` | Consent categories and method | Consent banner interaction |
| `session` | Session ID, visit count, start time | Session start |
| `device` | Browser, OS, viewport, screen resolution | Page load |
| `app` | App name, version, environment, platform | Initialization (once) |
| `campaign` | UTM parameters, traffic source | Session start / landing page |
| `location` | Country, region, city, timezone | Page load |

See the [Context Reference](/reference/contexts) for all fields within each domain.

## Subscribing to Events

Use `on` to listen for events as they flow through the data layer. This is how adapters, loggers, and side-effect handlers receive events.

### Exact match

```ts
odl.on('ecommerce.purchase', (event) => {
  reportRevenue(event.data.revenue, event.data.currency);
});
```

### Wildcard match

Wildcards match any action within a category:

```ts
// All ecommerce events
odl.on('ecommerce.*', (event) => {
  sendToAnalytics(event);
});

// All events
odl.on('*', (event) => {
  console.log(`[${event.timestamp}] ${event.event}`);
});
```

### Unsubscribing

`on` returns an unsubscribe function. Call it to stop listening:

```ts
const unsubscribe = odl.on('page.view', (event) => {
  updateHeadline(event.data?.title);
});

// Later, when you no longer need the subscription
unsubscribe();
```

## Using Plugins

Plugins extend the SDK's behavior without modifying the core. A plugin is an object that implements the `ODLPlugin` interface.

### Registering plugins

Register a plugin with `use`:

```ts
import { debug } from '@opendatalayer/sdk';

odl.use(debug({ verbose: true }));
```

Or pass plugins during initialization:

```ts
const odl = new OpenDataLayer({
  plugins: [debug(), persistence()],
});
```

### Plugin lifecycle

| Hook | When it runs | What it can do |
|------|-------------|----------------|
| `initialize(odl)` | Once, when `use()` is called | Set up subscriptions, read state, add middleware |
| `beforeEvent(event)` | Before every event is stored/emitted | Mutate the event or return `null` to cancel it |
| `afterEvent(event)` | After every event is stored/emitted | Side effects: logging, forwarding to APIs |
| `destroy()` | When `odl.destroy()` is called | Clean up listeners, intervals, resources |

### Writing a custom plugin

```ts
import type { ODLPlugin } from '@opendatalayer/sdk';

function myConsentFilter(): ODLPlugin {
  return {
    name: 'consent-filter',

    beforeEvent(event) {
      const consent = event.context?.consent as
        | Record<string, boolean>
        | undefined;

      // Drop marketing events if marketing consent is not granted
      if (
        event.event.startsWith('interaction.') &&
        !consent?.marketing
      ) {
        return null; // cancel the event
      }

      return event; // allow the event
    },
  };
}

odl.use(myConsentFilter());
```

## Built-in Plugins

The SDK ships with three plugins that cover common use cases.

### debug

Logs every event to the console. Useful during development.

```ts
import { debug } from '@opendatalayer/sdk';

odl.use(debug());

// With options
odl.use(debug({
  logger: (...args) => myCustomLogger.debug(...args), // custom logger
  verbose: true, // include full context in output
}));
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logger` | `(...args: unknown[]) => void` | `console.debug` | Custom logging function |
| `verbose` | `boolean` | `false` | When true, includes the full context object in log output |

### persistence

Persists events to `localStorage` and restores them on the next page load. Useful for ensuring offline events are not lost.

```ts
import { persistence } from '@opendatalayer/sdk';

odl.use(persistence());

// With options
odl.use(persistence({
  key: 'my_app_events',  // localStorage key
  maxEvents: 50,          // cap stored events (oldest discarded first)
}));
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | `"odl_events"` | localStorage key for event storage |
| `maxEvents` | `number` | `100` | Maximum number of events to persist |

::: tip
The persistence plugin gracefully degrades to a no-op in server-side rendering or environments where `localStorage` is not available.
:::

### autoPageView

Automatically fires `page.view` on initial load and `page.virtual_view` on SPA navigation. It patches `history.pushState` and `history.replaceState` to detect programmatic navigation (React Router, Vue Router, etc.).

```ts
import { autoPageView } from '@opendatalayer/sdk';

odl.use(autoPageView());

// With options
odl.use(autoPageView({
  trackHistory: true,  // detect pushState/replaceState navigation
  trackHash: false,    // also listen for hashchange events
}));
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trackHistory` | `boolean` | `true` | Listen for `popstate` and patch `pushState`/`replaceState` |
| `trackHash` | `boolean` | `false` | Also listen for `hashchange` events |

::: warning
If you use `autoPageView`, do not manually fire `page.view` events -- they will be doubled.
:::

## Middleware

For advanced use cases, you can add raw middleware functions to the pipeline. Each middleware receives the event and a `next` callback. Call `next()` to pass the event through; omit the call to cancel it.

```ts
// Add a timestamp override for testing
odl.addMiddleware((event, next) => {
  if (process.env.NODE_ENV === 'test') {
    event.timestamp = '2026-01-01T00:00:00.000Z';
  }
  next();
});

// Strip PII from all events
odl.addMiddleware((event, next) => {
  if (event.context?.user) {
    const user = event.context.user as Record<string, unknown>;
    delete user.traits;
  }
  next();
});
```

::: tip
Plugin authors should prefer `beforeEvent` and `afterEvent` hooks. Use `addMiddleware` only when you need full control over the pipeline flow.
:::

## TypeScript Usage

The SDK is written in TypeScript and exports all types. For the best developer experience, combine the SDK with `@opendatalayer/types` to get compile-time validation of event names and payloads.

### Core type imports

```ts
import type { ODLEvent } from '@opendatalayer/sdk';
import type { ODLOptions } from '@opendatalayer/sdk';
import type { ODLPlugin } from '@opendatalayer/sdk';
import type { MiddlewareFn } from '@opendatalayer/sdk';
```

### Typed event handler

```ts
import type { ODLEvent } from '@opendatalayer/sdk';

function handlePurchase(event: ODLEvent): void {
  const data = event.data as {
    orderId: string;
    revenue: number;
    currency: string;
    products: Array<{ id: string; name: string; price: number }>;
  };

  reportRevenue(data.orderId, data.revenue, data.currency);
}

odl.on('ecommerce.purchase', handlePurchase);
```

### Typed plugin

```ts
import type { ODLPlugin, ODLEvent } from '@opendatalayer/sdk';
import type { DataLayer } from '@opendatalayer/sdk';

function rateLimiter(maxPerSecond: number): ODLPlugin {
  let count = 0;
  let resetTimer: ReturnType<typeof setInterval> | undefined;

  return {
    name: 'rate-limiter',

    initialize(_odl: DataLayer): void {
      resetTimer = setInterval(() => {
        count = 0;
      }, 1000);
    },

    beforeEvent(event: ODLEvent): ODLEvent | null {
      if (count >= maxPerSecond) {
        return null; // drop the event
      }
      count++;
      return event;
    },

    destroy(): void {
      if (resetTimer) clearInterval(resetTimer);
    },
  };
}
```

## Utility Methods

The SDK exposes a few additional methods for inspection and lifecycle management.

### getEvents

Returns an immutable array of all events that have passed through the pipeline:

```ts
const allEvents = odl.getEvents();
console.log(`Total events tracked: ${allEvents.length}`);
```

### reset

Clears all stored events and resets context to empty:

```ts
odl.reset();
```

### destroy

Tears down all plugins and cleans up resources. Call this when your application unmounts:

```ts
// In a React effect cleanup, for example
useEffect(() => {
  return () => odl.destroy();
}, []);
```

## Full Example

Putting it all together -- a complete setup for a typical e-commerce SPA:

```ts
import { OpenDataLayer, debug, persistence, autoPageView } from '@opendatalayer/sdk';
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

// 1. Create the instance
const odl = new OpenDataLayer({
  plugins: [
    debug({ verbose: process.env.NODE_ENV === 'development' }),
    persistence({ maxEvents: 200 }),
    autoPageView({ trackHistory: true }),
  ],
  context: {
    app: {
      name: 'Acme Store',
      version: '3.1.0',
      environment: process.env.NODE_ENV,
      platform: 'web',
    },
  },
  source: { name: 'acme-store-web', version: '3.1.0' },
});

// 2. Add adapters
odl.use(gtmAdapter({ includeContext: true }));
odl.use(segmentAdapter({ autoIdentify: true }));

// 3. Set consent (after the user interacts with the banner)
function onConsentGranted(categories: Record<string, boolean>) {
  odl.setContext('consent', { ...categories, method: 'explicit' });
  odl.track('consent.given', { categories, method: 'explicit', source: 'banner' });
}

// 4. Identify the user after login
function onLogin(userId: string, traits: Record<string, unknown>) {
  odl.setContext('user', { id: userId, isAuthenticated: true, traits });
  odl.track('user.signed_in', { userId, method: 'email' });
}

// 5. Track ecommerce events
function onPurchase(order: { id: string; total: number; products: unknown[] }) {
  odl.track('ecommerce.purchase', {
    orderId: order.id,
    revenue: order.total,
    currency: 'USD',
    products: order.products,
  });
}

export { odl, onConsentGranted, onLogin, onPurchase };
```

## Next Steps

- Learn how to [validate events](/guide/validation) against JSON Schemas at runtime.
- Browse the [Adapters](/guide/adapters) guide to connect to third-party destinations.
- See the [Event Reference](/reference/events) for all standard event types.
