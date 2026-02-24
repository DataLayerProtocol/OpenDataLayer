# Getting Started

This guide walks you through installing the OpenDataLayer SDK, initializing it in your application, and tracking your first event.

## Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

## Installation

```bash
npm install @opendatalayer/sdk
```

If you also want compile-time validation of event payloads, install the types package:

```bash
npm install @opendatalayer/types
```

## Initialize the SDK

Create an ODL instance at the entry point of your application:

```ts
import { createODL } from '@opendatalayer/sdk';

const odl = createODL({
  // Optional: enable debug logging in development
  debug: process.env.NODE_ENV === 'development',
});
```

## Set Context

Context is persistent metadata that gets attached to every event. Set it once and it flows through automatically.

```ts
// Page context (typically set on every route change)
odl.setContext('page', {
  url: window.location.href,
  path: window.location.pathname,
  title: document.title,
  referrer: document.referrer,
});

// Application context (set once at startup)
odl.setContext('app', {
  name: 'My Store',
  version: '2.4.1',
  environment: 'production',
  platform: 'web',
});
```

## Track Your First Event

```ts
odl.track('page.view');
```

Every call to `track` produces a structured event envelope:

```json
{
  "event": "page.view",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-06-15T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": {
    "page": { "url": "https://example.com/", "path": "/", "title": "Home" },
    "app": { "name": "My Store", "version": "2.4.1" }
  },
  "data": {}
}
```

## Track Ecommerce Events

```ts
odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-123',
    name: 'Running Shoes',
    brand: 'SpeedRunner',
    category: 'Footwear/Running',
    price: 129.99,
    currency: 'USD',
  },
});
```

## Subscribe to Events

Listen for events to forward them to analytics providers, log them, or trigger side effects:

```ts
// Listen for all events
odl.on('*', (event) => {
  console.log('Event:', event.event, event.data);
});

// Listen for a specific category
odl.on('ecommerce.*', (event) => {
  sendToAnalytics(event);
});
```

## Add an Adapter

Adapters route events to third-party destinations. Each adapter decides which events it cares about and how to transform them.

```ts
import { createGoogleAnalyticsAdapter } from '@opendatalayer/adapter-ga4';

odl.use(createGoogleAnalyticsAdapter({
  measurementId: 'G-XXXXXXXXXX',
}));
```

See the [Adapters](/guide/adapters) guide for the full list of available adapters.

## Next Steps

- Learn about the [Core Concepts](/guide/core-concepts) behind the data model.
- Browse the [Event Reference](/reference/events) for all standard event types.
- Read about [Validation](/guide/validation) to enforce schemas at runtime.
