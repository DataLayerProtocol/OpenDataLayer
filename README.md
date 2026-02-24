# OpenDataLayer (ODL)

**A universal, open-source data layer protocol for analytics and tracking.**

[![CI](https://github.com/DataLayerProtocol/OpenDataLayer/actions/workflows/ci.yml/badge.svg)](https://github.com/DataLayerProtocol/OpenDataLayer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@opendatalayer/sdk.svg)](https://www.npmjs.com/package/@opendatalayer/sdk)

---

OpenDataLayer is a **platform-agnostic specification** for how analytics events should be structured, validated, and consumed. Think OpenAPI, but for analytics and tracking.

**JSON Schemas are the single source of truth.** TypeScript types, documentation, validators, and test fixtures are all derived from the schemas -- eliminating drift between spec and implementation.

## Why?

The analytics ecosystem is fragmented. Every platform -- GA4, Segment, Adobe, Amplitude, Tealium -- has its own data layer format, naming conventions, and event taxonomy. This means:

- **Vendor lock-in**: Switching platforms requires rewriting your tracking
- **Inconsistency**: Different naming across platforms (e.g., `purchase` vs `order_completed` vs `transaction`)
- **No validation**: Events are typically fire-and-forget with no schema enforcement
- **Duplicated effort**: Every team builds their own data layer abstraction

OpenDataLayer solves this with a **single, standardized protocol** that any analytics tool can consume through adapters.

## Quick Start

```bash
npm install @opendatalayer/sdk
```

```typescript
import { OpenDataLayer } from '@opendatalayer/sdk';

// Initialize
const odl = new OpenDataLayer({
  source: { name: 'my-app', version: '1.0.0' },
});

// Set context (persists across all events)
odl.setContext('page', {
  url: window.location.href,
  path: window.location.pathname,
  title: document.title,
});

odl.setContext('user', {
  id: 'user-123',
  isAuthenticated: true,
  traits: { plan: 'premium' },
});

// Track events
odl.track('page.view');

odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-456',
    name: 'Running Shoes',
    price: 129.99,
    currency: 'USD',
    category: 'Footwear/Running',
  },
});

odl.track('ecommerce.purchase', {
  orderId: 'ORD-789',
  total: 142.49,
  currency: 'USD',
  products: [
    { id: 'SKU-456', name: 'Running Shoes', price: 129.99, currency: 'USD', quantity: 1 },
  ],
});

// Subscribe to events
const unsubscribe = odl.on('ecommerce.*', (event) => {
  console.log('Ecommerce event:', event);
});

// Use with adapters
import { gtmAdapter } from '@opendatalayer/adapter-gtm';

odl.use(gtmAdapter());  // Auto-pushes to window.dataLayer in GA4 format
```

## Core Concepts

### Event Model: `event + context + data`

Every ODL event has three parts:

```json
{
  "event": "ecommerce.purchase",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": {
    "page": { "url": "https://example.com/checkout", "path": "/checkout" },
    "user": { "id": "user-123", "isAuthenticated": true },
    "consent": { "status": "granted", "purposes": { "analytics": true } }
  },
  "data": {
    "orderId": "ORD-789",
    "total": 142.49,
    "currency": "USD",
    "products": [{ "id": "SKU-456", "name": "Running Shoes", "price": 129.99 }]
  },
  "customDimensions": {
    "ab_test_variant": "checkout-v2"
  }
}
```

- **`event`** -- Dot-namespaced name (`category.action`). Enables wildcard subscriptions.
- **`context`** -- Ambient state that persists across events (page, user, consent, session, device, app, campaign, location).
- **`data`** -- Event-specific payload. Each event type has its own schema.
- **`customDimensions`** -- Escape hatch for implementation-specific key-value pairs.

### Event Taxonomy

ODL defines a comprehensive event taxonomy organized by category:

| Category | Events | Description |
|----------|--------|-------------|
| `page` | `view`, `leave`, `virtual_view` | Page lifecycle |
| `ecommerce` | 17 events | Full purchase funnel |
| `media` | 11 events | Video/audio playback |
| `consent` | `given`, `revoked`, `preferences_updated` | Privacy consent |
| `user` | `signed_up`, `signed_in`, `signed_out`, `profile_updated`, `identified` | User lifecycle |
| `form` | `viewed`, `started`, `step_completed`, `submitted`, `error`, `abandoned` | Form interactions |
| `search` | `performed`, `result_clicked`, `filter_applied` | Search behavior |
| `error` | `occurred`, `boundary_triggered` | Error tracking |
| `performance` | `page_load`, `web_vital`, `resource_timing`, `long_task` | Performance metrics |
| `interaction` | `element_clicked`, `element_visible`, `scroll_depth`, `file_downloaded`, `share`, `print` | UI interactions |
| `custom` | Wildcard | Escape hatch |

### Schema-First Design

JSON Schemas (Draft 2020-12) are the **single source of truth**:

```
schemas/v1/
├── core/           # Event envelope, context wrapper, shared primitives
├── context/        # All 8 context object schemas
├── events/         # ~50 event schemas organized by category
└── enums/          # Currency codes, consent purposes, device types, etc.
```

Everything derives from schemas:
- **TypeScript types**: `npm run generate:types`
- **Validation**: `@opendatalayer/validator` uses schemas at runtime
- **Documentation**: Event/context reference auto-generated from schemas
- **Test fixtures**: Validated against schemas

## Packages

| Package | Description |
|---------|-------------|
| `@opendatalayer/sdk` | Reference implementation -- track events, manage context, plugin system |
| `@opendatalayer/types` | TypeScript types generated from JSON schemas |
| `@opendatalayer/validator` | Ajv-based validation engine + CLI (`odl validate`) |
| `@opendatalayer/testing` | Test helpers, Vitest/Jest matchers, fixtures, event spy |
| `@opendatalayer/adapter-gtm` | Google Tag Manager adapter (GA4 format) |
| `@opendatalayer/adapter-segment` | Segment analytics.js adapter |
| `@opendatalayer/adapter-webhook` | Generic webhook adapter (batch + real-time) |
| `@opendatalayer/adapter-adobe` | Adobe Analytics / AEP adapter _(preview)_ |
| `@opendatalayer/adapter-amplitude` | Amplitude adapter _(preview)_ |
| `@opendatalayer/adapter-piwik` | Piwik PRO / Matomo adapter _(preview)_ |
| `@opendatalayer/adapter-tealium` | Tealium iQ adapter _(preview)_ |

> **Preview adapters** export the options interface and plugin skeleton but do not yet implement event mapping. They are ready for community contribution — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Validation

Validate events at build time or runtime:

```bash
# CLI
npx @opendatalayer/validator validate events.json

# Programmatic
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator();
const result = validator.validate(myEvent);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

The validator includes **semantic rules** beyond schema validation:
- Consent must be granted before tracking events
- Ecommerce events must have consistent currency
- Required context objects must be present for their event categories

## Testing

```bash
npm install -D @opendatalayer/testing
```

```typescript
import { ODLSpy, createTestEvent, createPurchaseEvent, installMatchers } from '@opendatalayer/testing';

// Install custom matchers
installMatchers();

// Use fixtures
const event = createPurchaseEvent();
expect(event).toBeValidODLEvent();

// Spy on events
const spy = new ODLSpy();
odl.on('*', spy.handler());

odl.track('page.view');
expect(spy.hasEvent('page.view')).toBe(true);
```

## Adapters

Adapters translate ODL events to platform-specific formats:

```typescript
import { OpenDataLayer } from '@opendatalayer/sdk';
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

const odl = new OpenDataLayer();

// Events automatically pushed to both platforms
odl.use(gtmAdapter());
odl.use(segmentAdapter());

// ODL: ecommerce.purchase -> GTM: purchase (GA4 format) + Segment: Order Completed
odl.track('ecommerce.purchase', { ... });
```

## Development

```bash
# Install dependencies
npm install

# Validate all JSON schemas
npm run validate:schemas

# Generate TypeScript types from schemas
npm run generate:types

# Build all packages
npm run build

# Run all tests
npm test

# Lint
npm run lint
```

## Project Structure

```
OpenDataLayer/
├── spec/v1/           # Human-readable protocol specification
├── schemas/v1/        # JSON Schemas (source of truth)
├── packages/
│   ├── sdk/           # Reference implementation
│   ├── types/         # Generated TypeScript types
│   ├── validator/     # Schema validation + CLI
│   └── testing/       # Test helpers + fixtures
├── adapters/          # Platform adapters (GTM, Segment, etc.)
├── scripts/           # Build tooling (type gen, schema validation)
├── examples/          # Working examples
└── docs/              # VitePress documentation site
```

## Protocol Specification

The full protocol specification is in [`spec/v1/`](./spec/v1/):

- [Overview](./spec/v1/overview.md) -- Protocol overview and design rationale
- [Data Model](./spec/v1/data-model.md) -- Core event+context model
- [Events](./spec/v1/events.md) -- Event naming and full taxonomy
- [Context Objects](./spec/v1/context-objects.md) -- All context definitions
- [Transport](./spec/v1/transport.md) -- How events are pushed and consumed
- [Privacy](./spec/v1/privacy.md) -- Privacy-by-design principles
- [Conformance](./spec/v1/conformance.md) -- Conformance levels
- [Versioning](./spec/v1/versioning.md) -- Versioning and compatibility
- [Extensions](./spec/v1/extensions.md) -- Custom events and contexts

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE)
